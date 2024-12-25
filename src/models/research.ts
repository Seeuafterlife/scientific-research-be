import { Schema, model, Document, Types } from "mongoose";

export interface IResearch extends Document {
    title: string;
    abstract: string;
    description: string;
    author: string;
    image: string;
    rating:number;
    source:string;
    createdAt: Date;
}

const ResearchSchema = new Schema<IResearch>({
    title: { type: String, required: true },
    abstract: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: String, required: true },
    image: { type: String, required: true },
    rating: { type: Number, default:0 },
    source:{ type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

export const ResearchModel = model<IResearch>("Research", ResearchSchema);
