import { Request, Response } from "express";
import { RatingModel } from "../models/rating";
import { ResearchModel } from "../models/research";

export class RatingController {
    // Create a new rating
    static async createRating(req: Request, res: Response) {
        const token = req.header('Authorization')?.replace('Bearer ', ''); // Lấy token từ header

        if (!token) {
            res.status(401).json({ message: "Authentication token is required." });
            return;
        }

        try {
            const { research, user } = req.body;

            // Validate required fields
            if (!research || !user) {
                return res.status(400).json({ error: "Research and user are required" });
            }

            // Kiểm tra xem rating đã tồn tại chưa
            const existingRating = await RatingModel.findOne({ research, user });

            if (existingRating) {
                // Nếu tồn tại, xóa rating
                await RatingModel.findByIdAndDelete(existingRating._id);

                // Giảm giá trị rating của research
                const updatedResearch = await ResearchModel.findByIdAndUpdate(
                    research,
                    { $inc: { rating: -1 } }, // Decrement the rating field by 1
                    { new: true } // Return the updated document
                );

                return res.status(200).json({
                    message: "Rating removed successfully",
                });
            }

            // Create new rating
            const rating = await RatingModel.create({ research, user });

            // Update rating count in the Research model
            const updatedResearch = await ResearchModel.findByIdAndUpdate(
                research,
                { $inc: { rating: 1 } }, // Increment the rating field by 1
                { new: true } // Return the updated document
            );

            if (!updatedResearch) {
                return res.status(404).json({ error: "Research not found" });
            }

            res.status(201).json({message:"Rating successfully"});
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }
}
