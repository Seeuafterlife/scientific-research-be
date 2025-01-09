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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const database_1 = require("./database");
const research_controller_1 = require("./controllers/research-controller");
const user_controller_1 = require("./controllers/user-controller");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dashboard_controller_1 = require("./controllers/dashboard-controller");
const multer_1 = __importDefault(require("multer"));
const rating_controller_1 = require("./controllers/rating-controller");
const app = express();
const upload = (0, multer_1.default)();
app.use((0, cors_1.default)({
    origin: "http://localhost:3000", // URL client được phép truy cập
    methods: ["GET", "POST", "PUT", "DELETE"], // Các phương thức được phép
    credentials: false // Nếu cần gửi cookie hoặc thông tin xác thực
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path_1.default.join(__dirname, '../public')));
// Research routes
app.post("/research", research_controller_1.uploadMiddleware, research_controller_1.ResearchController.createResearch);
app.get("/research/all", research_controller_1.ResearchController.getAllResearch);
app.get("/research/search", research_controller_1.ResearchController.searchResearchByTitle);
app.get("/research/favorite-research", research_controller_1.ResearchController.getRatedResearch);
app.get("/research/:id", research_controller_1.ResearchController.getResearchById);
app.put("/research/:id", research_controller_1.uploadMiddleware, research_controller_1.ResearchController.updateResearch);
app.delete("/research/:id", research_controller_1.uploadMiddleware, research_controller_1.ResearchController.deleteResearch);
app.post("/user/register", user_controller_1.UserController.registerUser);
app.post("/user/login", user_controller_1.UserController.loginUser);
app.put('/user/update', user_controller_1.uploadUserMiddleware, user_controller_1.UserController.updateUser);
app.put('/user/change-password', user_controller_1.UserController.changePassword);
app.get("/dashboard", dashboard_controller_1.DashboardController.getInit);
app.post("/rating", rating_controller_1.RatingController.createRating);
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.connectDatabase)();
    app.listen(5000, () => console.log("Server is running on port 5000"));
});
startServer();
