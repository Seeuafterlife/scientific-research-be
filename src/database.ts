import mongoose from "mongoose";
import { UserModel } from "./models/user"; // Import UserModel
import { ResearchModel } from "./models/research";

export const connectDatabase = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/scientific-research");
        console.log("Connected to MongoDB");
        console.log(mongoose.modelNames());
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};
