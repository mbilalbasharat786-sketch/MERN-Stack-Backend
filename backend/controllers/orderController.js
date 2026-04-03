import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import SibApiV3Sdk from "sib-api-v3-sdk";


// Global variables
const currency = "usd";
const deliveryCharges = 10;

// gateway initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Placing order using COD
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    // ⭐ FIX FOR COLOR SUPPORT
    let processedItems = items.map((item) => {
      let realSize = item.size;
      let color = null;

      if (item.size && item.size.includes("-")) {
        const parts = item.size.split("-");
        realSize = parts[0];
        color = parts[1];
      }

      console.log("📦 Incoming Size:", item.size);
      console.log("🎨 Extracted Color:", color);
      console.log("📏 Extracted Size:", realSize);

      return {
        ...item,
        size: realSize,
        color: color,
      };
    });

    const orderData = {
      userId,
      items: processedItems, // ⭐ Updated
      amount,
      address,
      paymentMethod: "COD",
      payment: false,
      isRead: false,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });
    await sendOrderEmail(newOrder);

    res.json({
      success: true,
      message: "Order Placed",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};


// Placing order using Stripe
const placeOrderStripe = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;
    const { origin } = req.headers;

    const orderData = {
      userId,
      items,
      amount,
      address,
      paymentMethod: "Stripe",
      payment: false,
      isRead: false,

      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    const line_items = items.map((item) => ({
      price_data: {
        currency: currency,
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));
    line_items.push({
      price_data: {
        currency: currency,
        product_data: {
          name: "Delivery Fee",
        },
        unit_amount: deliveryCharges * 100,
      },
      quantity: 1,
    });
    const session = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: "payment",
    });

    res.json({
      success: true,
      session_url: session.url,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// verify stripe
const verifyStripe = async (req, res) => {
  const { orderId, success, userId } = req.body;
  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      await userModel.findByIdAndUpdate(userId, { cartdata: {} });
      const order = await orderModel.findById(orderId);
      await sendOrderEmail(order);

      res.json({
        success: true,
      });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false });
    }
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Placing order using Razorpay
const placeOrderRazorpay = async (req, res) => {};

// All orders data for admin panel
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// User Order data for frontend
const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const orders = await orderModel.find({ userId });
    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Update order status from admin panel
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await orderModel.findByIdAndUpdate(orderId, { status });
    res.json({
      success: true,
      message: "Status Updated",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};
// delete order by admin
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const deletedOrder = await orderModel.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
// 🟢 Get Unread Orders Count
export const getUnreadOrdersCount = async (req, res) => {
  try {
    const count = await orderModel.countDocuments({ isRead: false });
    res.json({ success: true, count });
  } catch (error) {
    console.error("Error getting unread orders count:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🟢 Mark Order as Read
export const markOrderAsRead = async (req, res) => {
  try {
    const { orderId } = req.params;
    await orderModel.findByIdAndUpdate(orderId, { isRead: true });
    res.json({ success: true, message: "Order marked as read" });
  } catch (error) {
    console.error("Error marking order as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Mark all orders as read
export const markAllOrdersAsRead = async (req, res) => {
  try {
    await orderModel.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: "All orders marked as read" });
  } catch (error) {
    console.error("Error marking all orders as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
console.log("KEY:", process.env.SMTP_API_KEY ? "FOUND" : "MISSING");


// 🟢 Email sending helper using Brevo
const sendOrderEmail = async (order) => {
  try {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications["api-key"];
    apiKey.apiKey = process.env.SMTP_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const emailHTML = `
      <h2>🛍️ New Order Received</h2>
      <p><strong>Items:</strong></p>
      <ul>
        ${order.items
          .map(
            (item) =>
              `<li>${item.name} x ${item.quantity} ${
                item.size ? `(${item.size})` : ""
              }</li>`
          )
          .join("")}
      </ul>
      <p><strong>Customer:</strong> ${
        order.address.firstName || ""
      } ${order.address.lastName || ""}</p>
      <p><strong>Address:</strong> ${order.address.street}, ${
      order.address.city
    }, ${order.address.zipCode}, ${order.address.country}</p>
      <p><strong>Phone:</strong> ${order.address.phone}</p>
      <p><strong>Items Count:</strong> ${order.items.length}</p>
      <p><strong>Method:</strong> ${order.paymentMethod}</p>
      <p><strong>Payment:</strong> ${order.payment ? "Paid" : "Pending"}</p>
      <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
      <p><strong>Total:</strong> PKR ${order.amount}</p>
    `;

    const sendSmtpEmail = {
      sender: { email: process.env.STORE_ADMIN_EMAIL, name: "Jamal Collection" },
      to: [{ email: process.env.STORE_ADMIN_EMAIL, name: "Admin" }],
      subject: `🛒 New Order Received - Jamal Collection`,
      htmlContent: emailHTML,
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Order email sent successfully to admin!");
  } catch (error) {
    console.error("❌ Error sending order email:", error);
  }
};

console.log("✅ sendOrderEmail() completed successfully!");


export {
  placeOrder,
  placeOrderStripe,
  placeOrderRazorpay,
  deleteOrder,
  allOrders,
  userOrders,
  updateStatus,
  verifyStripe,
};

