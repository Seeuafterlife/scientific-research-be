import { Schema, model, Document, Types } from "mongoose";
import { IResearch } from "./research";

export interface IRating extends Document {
    research: Types.ObjectId | (IResearch & Document);
    user: Types.ObjectId;
    createdAt: Date;
}

const RatingSchema = new Schema<IRating>({
    research: { type: Schema.Types.ObjectId, ref: "Research", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
});

export const RatingModel = model<IRating>("Rating", RatingSchema);
