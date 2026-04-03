import mongoose, { mongo } from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  image: { type: Array, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  sizes: { type: Array, required: true },
  bestSeller: { type: Boolean },
  date: { type: Number, required: true },
    // ⭐ NEW FIELDS (Color Variants System)
  colors: {
    type: [String], // ["Black", "White", "Red"]
    default: [],
  },

  imagesByColor: {
    type: Object,
    default: {}, 
    // Example:
    // {
    //   Black: ["black1.jpg", "black2.jpg"],
    //   Red: ["red1.jpg", "red2.jpg"]
    // }
  },
  reviews: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }, // Kisne review diya
            name: { type: String, required: true }, // User ka naam
            rating: { type: Number, required: true }, // 1 se 5 stars
            comment: { type: String, required: true }, // Review text
            date: { type: Date, default: Date.now } // Kab diya
        }
    ],
    rating: { type: Number, required: true, default: 0 }, // Average Rating (e.g. 4.5)
    numReviews: { type: Number, required: true, default: 0 }, // Total kitne logo ne review diya
    
}, { minimize: false });

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
