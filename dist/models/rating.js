"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingModel = void 0;
const mongoose_1 = require("mongoose");
const RatingSchema = new mongoose_1.Schema({
    research: { type: mongoose_1.Schema.Types.ObjectId, ref: "Research", required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
});
exports.RatingModel = (0, mongoose_1.model)("Rating", RatingSchema);
