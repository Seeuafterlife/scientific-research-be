const express = require("express");

import { connectDatabase } from "./database";
import { ResearchController, uploadMiddleware } from "./controllers/research-controller";
import { uploadUserMiddleware, UserController } from "./controllers/user-controller";
import cors from "cors";
import path from 'path';
import { DashboardController } from "./controllers/dashboard-controller";
import multer from "multer";
import { RatingController } from "./controllers/rating-controller";

const app = express();
const upload = multer();

app.use(cors({
    origin: "http://localhost:3000", // URL client được phép truy cập
    methods: ["GET", "POST", "PUT", "DELETE"], // Các phương thức được phép
    credentials: false // Nếu cần gửi cookie hoặc thông tin xác thực
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

// Research routes
app.post("/research", uploadMiddleware, ResearchController.createResearch);
app.get("/research/all", ResearchController.getAllResearch);
app.get("/research/search", ResearchController.searchResearchByTitle);
app.get("/research/favorite-research", ResearchController.getRatedResearch);
app.get("/research/:id", ResearchController.getResearchById);
app.put("/research/:id", uploadMiddleware, ResearchController.updateResearch);
app.delete("/research/:id", uploadMiddleware, ResearchController.deleteResearch)

app.post("/user/register", UserController.registerUser);
app.post("/user/login", UserController.loginUser);
app.put('/user/update',uploadUserMiddleware, UserController.updateUser);
app.put('/user/change-password', UserController.changePassword);

app.get("/dashboard", DashboardController.getInit);

app.post("/rating", RatingController.createRating);

const startServer = async () => {
    await connectDatabase();
    app.listen(5000, () => console.log("Server is running on port 5000"));
};

startServer();
