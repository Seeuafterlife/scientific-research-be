import multer from 'multer';
import fs from 'fs';
import { Request } from 'express';
import path from 'path';

/**
 * Hàm khởi tạo middleware Multer tùy chỉnh thư mục đích
 * @param uploadDir - Đường dẫn thư mục nơi lưu file
 * @returns - Middleware Multer
 */
export const createUploadMiddleware = (uploadDir: string) => {
    // Kiểm tra và tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Cấu hình Multer
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir); // Thư mục lưu file
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`); // Tên file với timestamp
        },
    });

    return multer({ storage });
};

/**
 * Hàm xử lý file upload sau khi lưu
 * @param req - Request từ Express
 * @returns - Đường dẫn file hoặc null nếu không có file
 */
export const handleFileUpload = (req: Request, uploadBasePath: string = '/upload'): string | null => {
    if (!req.file) {
        return null; // Không có file nào được upload
    }

    // Trả về đường dẫn file tương đối
    return `http://localhost:5000/${uploadBasePath}/${req.file.filename}`;
};

/**
 * Hàm xóa file theo đường dẫn
 * @param filePath - Đường dẫn file đầy đủ cần xóa
 * @returns - true nếu xóa thành công, false nếu không
 */
export const deleteFile = (filePath: string): boolean => {
    try {
        const absolutePath = path.resolve(filePath); // Chuyển thành đường dẫn tuyệt đối
        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath); // Xóa file
            console.log(`File deleted: ${absolutePath}`);
            return true;
        } else {
            console.warn(`File not found: ${absolutePath}`);
            return false;
        }
    } catch (error) {
        console.error(`Error deleting file: ${error}`);
        return false;
    }
};
