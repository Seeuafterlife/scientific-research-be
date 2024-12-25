import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    image:string;
    password: string;
    role: string; // 'ADMIN' | 'reviewer'
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image:{type:String, default:''},
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "reviewer"], default: "reviewer" },
});


export const UserModel = model<IUser>("User", UserSchema);
