import express from "express";
import { addSliderImage, getSliderImages, deleteSliderImage } from "../controllers/sliderController.js";
import upload from "../middlewares/multer.js"; // same as product upload
import adminAuth from "../middlewares/adminAuth.js";

const sliderRouter = express.Router();

// upload new image
sliderRouter.post("/add", adminAuth, upload.single("image"), addSliderImage);

// get all images (for frontend Hero.jsx)
sliderRouter.get("/list", getSliderImages);

// delete image (optional)
sliderRouter.delete("/delete/:id", adminAuth, deleteSliderImage);

export default sliderRouter;
