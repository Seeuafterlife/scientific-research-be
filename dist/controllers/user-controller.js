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
exports.UserController = exports.uploadUserMiddleware = void 0;
const user_1 = require("../models/user");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const upload_image_1 = require("../service/upload-image");
const inspector_1 = require("inspector");
const uploadDir = path_1.default.join(__dirname, '../../public/upload/user');
exports.uploadUserMiddleware = (0, upload_image_1.createUploadMiddleware)(uploadDir).single('file');
class UserController {
    static registerUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, email, password } = req.body;
            try {
                // Kiểm tra xem email đã tồn tại chưa
                const existingUser = yield user_1.UserModel.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({ message: "Email already exists." });
                }
                // Hash mật khẩu trước khi lưu
                const hashedPassword = yield bcrypt_1.default.hash(password, 10);
                // Tạo người dùng mới
                const newUser = new user_1.UserModel({
                    name,
                    email,
                    password: hashedPassword,
                    role: "reviewer",
                });
                yield newUser.save();
                // Tạo token để phản hồi
                const token = jsonwebtoken_1.default.sign({ id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, image: newUser.image }, process.env.JWT_SECRET || "your_secret_key", { expiresIn: "1d" });
                inspector_1.console.log(newUser);
                res.status(201).json({
                    token,
                });
            }
            catch (error) {
                res.status(500).json({ message: "Internal server error.", error });
            }
        });
    }
    ;
    static loginUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            try {
                // Kiểm tra email
                const user = yield user_1.UserModel.findOne({ email });
                if (!user) {
                    res.status(401).json({ message: "Invalid email or password" });
                    return;
                }
                // Kiểm tra mật khẩu
                const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
                if (!isPasswordValid) {
                    res.status(401).json({ message: "Invalid email or password" });
                    return;
                }
                // Tạo JWT token
                const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET || "your_secret_key", { expiresIn: "1d" });
                res.status(200).json({ token });
            }
            catch (error) {
                inspector_1.console.error(error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    static updateUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', ''); // Lấy token từ header
            if (!token) {
                res.status(401).json({ message: "Authentication token is required." });
                return;
            }
            try {
                // Xác thực token
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your_secret_key");
                //Tìm người dùng trong cơ sở dữ liệu
                const user = yield user_1.UserModel.findById(decoded.id);
                if (!user) {
                    res.status(404).json({ message: "User not found." });
                    return;
                }
                // Xóa ảnh cũ nếu có ảnh mới được upload
                const newFilePath = (0, upload_image_1.handleFileUpload)(req, "/upload/user");
                let image;
                if (newFilePath) {
                    if (user.image) {
                        const absoluteOldFilePath = path_1.default.join(__dirname, "../../public", user.image.replace("http://localhost:5000", ""));
                        (0, upload_image_1.deleteFile)(absoluteOldFilePath); // Xóa ảnh cũ
                    }
                    image = newFilePath; // Cập nhật đường dẫn ảnh mới
                }
                // Cập nhật name và image
                if (req.body.name)
                    user.name = req.body.name;
                if (image)
                    user.image = image;
                // Lưu người dùng đã cập nhật
                yield user.save();
                // Tạo JWT token
                const tokenNew = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, name: req.body.name, email: user.email, image: image ? image : user.image }, process.env.JWT_SECRET || "your_secret_key", { expiresIn: "1d" });
                // Trả về thông tin người dùng đã được cập nhật
                res.status(200).json({ message: "User updated successfully", token: tokenNew });
            }
            catch (error) {
                inspector_1.console.error(error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    static changePassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', ''); // Lấy token từ header
            if (!token) {
                res.status(401).json({ message: "Authentication token is required." });
                return;
            }
            try {
                // Xác thực token
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your_secret_key");
                // Tìm người dùng trong cơ sở dữ liệu
                const user = yield user_1.UserModel.findById(decoded.id);
                if (!user) {
                    res.status(404).json({ message: "User not found." });
                    return;
                }
                const { oldPassword, password } = req.body;
                // Kiểm tra xem oldPassword có đúng không
                const isPasswordValid = yield bcrypt_1.default.compare(oldPassword, user.password);
                if (!isPasswordValid) {
                    res.status(400).json({ message: "Old password is incorrect." });
                    return;
                }
                // Hash mật khẩu mới
                const hashedNewPassword = yield bcrypt_1.default.hash(password, 10);
                // Cập nhật mật khẩu
                user.password = hashedNewPassword;
                yield user.save();
                // Trả về phản hồi thành công
                res.status(200).json({ message: "Password changed successfully." });
            }
            catch (error) {
                inspector_1.console.error(error);
                res.status(500).json({ message: error });
            }
        });
    }
}
exports.UserController = UserController;
