// models/sliderModel.js
import mongoose from "mongoose";

const sliderSchema = new mongoose.Schema({
  image: { type: String, required: true }, // Cloudinary image URL
  createdAt: { type: Date, default: Date.now },
});

const sliderModel = mongoose.models.slider || mongoose.model("slider", sliderSchema);
export default sliderModel;
