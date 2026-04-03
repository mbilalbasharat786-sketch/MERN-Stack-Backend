import express from "express";
import {
  placeOrder,
  placeOrderStripe,
  placeOrderRazorpay,
  allOrders,
  userOrders,
  deleteOrder,
  updateStatus,
  verifyStripe,
  getUnreadOrdersCount,
  markOrderAsRead,
  markAllOrdersAsRead,

} from "../controllers/orderController.js";
import adminAuth from "../middlewares/adminAuth.js";
import authUser from "../middlewares/auth.js";

const orderRouter = express.Router();

// Admin Features
orderRouter.post("/list", adminAuth, allOrders);
orderRouter.post("/status", adminAuth, updateStatus);
orderRouter.post("/delete", adminAuth, deleteOrder);
// 🟢 Notification-related routes
orderRouter.get("/unread-count", adminAuth, getUnreadOrdersCount);
orderRouter.put("/mark-read/:orderId", adminAuth, markOrderAsRead);
orderRouter.put("/mark-all-read", adminAuth, markAllOrdersAsRead);


// Payment features
orderRouter.post("/place", authUser, placeOrder);
orderRouter.post("/stripe", authUser, placeOrderStripe);
orderRouter.post("/razorpay", authUser, placeOrderRazorpay);

// User Features
orderRouter.post("/userorders", authUser, userOrders);

// verify payment
orderRouter.post("/verifyStripe", authUser, verifyStripe);

export default orderRouter;
