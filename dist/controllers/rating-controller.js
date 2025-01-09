"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingController = void 0;
const rating_1 = require("../models/rating");
const research_1 = require("../models/research");
class RatingController {
    // Create a new rating
    static createRating(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', ''); // Lấy token từ header
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
                const existingRating = yield rating_1.RatingModel.findOne({ research, user });
                if (existingRating) {
                    // Nếu tồn tại, xóa rating
                    yield rating_1.RatingModel.findByIdAndDelete(existingRating._id);
                    // Giảm giá trị rating của research
                    const updatedResearch = yield research_1.ResearchModel.findByIdAndUpdate(research, { $inc: { rating: -1 } }, // Decrement the rating field by 1
                    { new: true } // Return the updated document
                    );
                    return res.status(200).json({
                        message: "Rating removed successfully",
                    });
                }
                // Create new rating
                const rating = yield rating_1.RatingModel.create({ research, user });
                // Update rating count in the Research model
                const updatedResearch = yield research_1.ResearchModel.findByIdAndUpdate(research, { $inc: { rating: 1 } }, // Increment the rating field by 1
                { new: true } // Return the updated document
                );
                if (!updatedResearch) {
                    return res.status(404).json({ error: "Research not found" });
                }
                res.status(201).json({ message: "Rating successfully" });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
}
exports.RatingController = RatingController;
