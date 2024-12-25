import { Request, Response } from "express";
import { ResearchModel } from "../models/research";
import { UserModel } from "../models/user";

export class DashboardController {
    static async getInit(req: Request, res: Response) {
        const token = req.header('Authorization')?.replace('Bearer ', ''); // Lấy token từ header

        if (!token) {
            res.status(401).json({ message: "Authentication token is required." });
            return;
        }

        try {
            const researchList = await ResearchModel.find();

            const userList = await UserModel.find();
            res.json({research:researchList, user: userList});
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }
}
