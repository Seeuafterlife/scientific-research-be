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
exports.ResearchController = exports.uploadMiddleware = void 0;
const research_1 = require("../models/research");
const upload_image_1 = require("../service/upload-image");
const path_1 = __importDefault(require("path"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const rating_1 = require("../models/rating");
const uploadDir = path_1.default.join(__dirname, '../../public/upload/research');
exports.uploadMiddleware = (0, upload_image_1.createUploadMiddleware)(uploadDir).single('file');
class ResearchController {
    static createResearch(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', ''); // Lấy token từ header
            if (!token) {
                res.status(401).json({ message: "Authentication token is required." });
                return;
            }
            try {
                // Xử lý file upload để lấy đường dẫn
                const filePath = (0, upload_image_1.handleFileUpload)(req, "/upload/research");
                if (!filePath) {
                    return res.status(400).json({ error: "No file uploaded" });
                }
                // Gán đường dẫn ảnh vào req.body
                req.body.image = filePath;
                // Tạo research mới với dữ liệu từ body
                const research = yield research_1.ResearchModel.create(req.body);
                // Trả về kết quả
                res.status(200).json({ message: "Research created successfully" });
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    }
    static getAllResearch(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', ''); // Lấy token từ header
                // Lấy danh sách research
                const researchList = yield research_1.ResearchModel.find();
                if (token) {
                    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your_secret_key");
                    // Nếu có id, kiểm tra bảng Rating
                    const researchWithRating = yield Promise.all(researchList.map((research) => __awaiter(this, void 0, void 0, function* () {
                        // Kiểm tra user (id) và research có trong bảng Rating
                        const ratingExists = yield rating_1.RatingModel.exists({
                            user: decoded.id,
                            research: research._id,
                        });
                        // Thêm trường isRating tạm thời vào kết quả
                        return Object.assign(Object.assign({}, research.toObject()), { isRating: !!ratingExists });
                    })));
                    return res.json(researchWithRating);
                }
                res.json(researchList);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    static getRatedResearch(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', ''); // Lấy token từ header
            const { title } = req.query; // Lấy từ khóa từ query parameters
            if (title === undefined) {
                return res.status(400).json({ error: "Title query parameter is required" });
            }
            if (!token) {
                res.status(401).json({ message: "Authentication token is required." });
                return;
            }
            try {
                // Xác thực token
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your_secret_key");
                // Tìm các rating có userId
                const ratings = yield rating_1.RatingModel.find({ user: decoded.id }).populate('research');
                // Duyệt qua danh sách rating và xử lý
                const researchList = ratings.map((rating) => {
                    // Kiểm tra nếu research là document đầy đủ
                    if (rating.research &&
                        typeof rating.research === 'object' &&
                        'toObject' in rating.research) {
                        return Object.assign(Object.assign({}, rating.research.toObject()), { isRating: true });
                    }
                    return null; // Xử lý trường hợp không hợp lệ
                }).filter(Boolean); // Loại bỏ null
                const result = researchList.filter((research) => research.title.includes(title));
                res.status(200).json(result);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    static searchResearchByTitle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { title } = req.query; // Lấy từ khóa từ query parameters
                const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', ''); // Lấy token từ header
                if (title === undefined) {
                    return res.status(400).json({ error: "Title query parameter is required" });
                }
                // Tìm kiếm nghiên cứu theo tiêu đề (không phân biệt hoa thường)
                const researchList = yield research_1.ResearchModel.find({
                    title: { $regex: title, $options: "i" } // Tìm kiếm tiêu đề chứa từ khóa, không phân biệt hoa thường
                });
                if (token) {
                    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your_secret_key");
                    // Nếu có id, kiểm tra bảng Rating
                    const researchWithRating = yield Promise.all(researchList.map((research) => __awaiter(this, void 0, void 0, function* () {
                        // Kiểm tra user (id) và research có trong bảng Rating
                        const ratingExists = yield rating_1.RatingModel.exists({
                            user: decoded.id,
                            research: research._id,
                        });
                        // Thêm trường isRating tạm thời vào kết quả
                        return Object.assign(Object.assign({}, research.toObject()), { isRating: !!ratingExists });
                    })));
                    return res.json(researchWithRating);
                }
                res.status(200).json(researchList);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    static getResearchById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const research = yield research_1.ResearchModel.findById(req.params.id);
                if (!research) {
                    return res.status(404).json({ message: "Research not found" });
                }
                res.json(research);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    static updateResearch(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', ''); // Lấy token từ header
            if (!token) {
                res.status(401).json({ message: "Authentication token is required." });
                return;
            }
            try {
                const existingResearch = yield research_1.ResearchModel.findById(req.params.id);
                if (!existingResearch) {
                    return res.status(404).json({ message: "Research not found" });
                }
                // Xóa ảnh cũ nếu có ảnh mới được upload
                const newFilePath = (0, upload_image_1.handleFileUpload)(req, "/upload/research");
                if (newFilePath) {
                    if (existingResearch.image) {
                        const absoluteOldFilePath = path_1.default.join(__dirname, "../../public", existingResearch.image.replace("https://scientific-research-be1.vercel.app/", ""));
                        (0, upload_image_1.deleteFile)(absoluteOldFilePath); // Xóa ảnh cũ
                    }
                    req.body.image = newFilePath; // Cập nhật đường dẫn ảnh mới
                }
                // Lọc các trường hợp lệ
                const updateFields = {
                    title: req.body.title,
                    abstract: req.body.abstract,
                    author: req.body.author,
                    source: req.body.source,
                    image: req.body.image,
                };
                // Loại bỏ các trường undefined
                Object.keys(updateFields).forEach((key) => {
                    if (updateFields[key] === undefined) {
                        delete updateFields[key];
                    }
                });
                // Cập nhật document
                const updatedResearch = yield research_1.ResearchModel.findByIdAndUpdate(req.params.id, updateFields, { new: true });
                res.status(200).json({ message: "Research updated successfully" });
                ;
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    static deleteResearch(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', ''); // Lấy token từ header
            if (!token) {
                res.status(401).json({ message: "Authentication token is required." });
                return;
            }
            try {
                const { id } = req.params;
                // Tìm nghiên cứu dựa trên id
                const research = yield research_1.ResearchModel.findById(id);
                if (!research) {
                    return res.status(404).json({ message: "Research not found" });
                }
                // Xóa file ảnh nếu tồn tại
                if (research.image) {
                    const absoluteFilePath = path_1.default.join(__dirname, "../../public", research.image.replace("https://scientific-research-be1.vercel.app/", ""));
                    (0, upload_image_1.deleteFile)(absoluteFilePath);
                }
                // Xóa tài liệu nghiên cứu khỏi cơ sở dữ liệu
                yield research_1.ResearchModel.findByIdAndDelete(id);
                res.status(200).json({ message: "Research deleted successfully" });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
}
exports.ResearchController = ResearchController;
