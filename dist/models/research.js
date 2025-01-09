"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchModel = void 0;
const mongoose_1 = require("mongoose");
const ResearchSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    abstract: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: String, required: true },
    image: { type: String, required: true },
    rating: { type: Number, default: 0 },
    source: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});
exports.ResearchModel = (0, mongoose_1.model)("Research", ResearchSchema);
