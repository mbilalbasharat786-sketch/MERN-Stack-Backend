import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    // ⭐ GOOGLE USERS KE LIYE PASSWORD OPTIONAL
    password: { type: String, required: false },

    cartData: { type: Object, default: {} },

    // ⭐ WISHLIST FIELD (NEW)
 wishlist: { type: Object, default: {} },
 
  },
  { minimize: false }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;


