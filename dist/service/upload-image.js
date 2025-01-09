"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.handleFileUpload = exports.createUploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Hàm khởi tạo middleware Multer tùy chỉnh thư mục đích
 * @param uploadDir - Đường dẫn thư mục nơi lưu file
 * @returns - Middleware Multer
 */
const createUploadMiddleware = (uploadDir) => {
    // Kiểm tra và tạo thư mục nếu chưa tồn tại
    if (!fs_1.default.existsSync(uploadDir)) {
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
    }
    // Cấu hình Multer
    const storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir); // Thư mục lưu file
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`); // Tên file với timestamp
        },
    });
    return (0, multer_1.default)({ storage });
};
exports.createUploadMiddleware = createUploadMiddleware;
/**
 * Hàm xử lý file upload sau khi lưu
 * @param req - Request từ Express
 * @returns - Đường dẫn file hoặc null nếu không có file
 */
const handleFileUpload = (req, uploadBasePath = '/upload') => {
    if (!req.file) {
        return null; // Không có file nào được upload
    }
    // Trả về đường dẫn file tương đối
    return `http://localhost:5000/${uploadBasePath}/${req.file.filename}`;
};
exports.handleFileUpload = handleFileUpload;
/**
 * Hàm xóa file theo đường dẫn
 * @param filePath - Đường dẫn file đầy đủ cần xóa
 * @returns - true nếu xóa thành công, false nếu không
 */
const deleteFile = (filePath) => {
    try {
        const absolutePath = path_1.default.resolve(filePath); // Chuyển thành đường dẫn tuyệt đối
        if (fs_1.default.existsSync(absolutePath)) {
            fs_1.default.unlinkSync(absolutePath); // Xóa file
            console.log(`File deleted: ${absolutePath}`);
            return true;
        }
        else {
            console.warn(`File not found: ${absolutePath}`);
            return false;
        }
    }
    catch (error) {
        console.error(`Error deleting file: ${error}`);
        return false;
    }
};
exports.deleteFile = deleteFile;
