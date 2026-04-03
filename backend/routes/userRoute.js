import express from "express";
import { loginUser, registerUser, adminLogin, googleLogin, addToWishlist, getUserWishlist, sendOTP } from "../controllers/userController.js";
import authUser from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.post("/send-otp", sendOTP); // ⭐ NEW: OTP Bhejne ka rasta
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin", adminLogin);
userRouter.post('/add-to-wishlist', authUser, addToWishlist); 
userRouter.post('/get-wishlist', authUser, getUserWishlist);
userRouter.post("/google-login", googleLogin);

export default userRouter;

