import { Request, Response } from "express";
import { UserModel } from "../models/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from 'path';
import { createUploadMiddleware, deleteFile, handleFileUpload } from "../service/upload-image";
import { console } from "inspector";

const uploadDir = path.join(__dirname, '../../public/upload/user');
export const uploadUserMiddleware = createUploadMiddleware(uploadDir).single('file');
export class UserController {
    static async registerUser (req: Request, res: Response){
        const { name, email, password } = req.body;

        try {
            // Kiểm tra xem email đã tồn tại chưa
            const existingUser = await UserModel.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "Email already exists." });
            }

            // Hash mật khẩu trước khi lưu
            const hashedPassword = await bcrypt.hash(password, 10);

            // Tạo người dùng mới
            const newUser = new UserModel({
                name,
                email,
                password: hashedPassword,
                role: "reviewer",
            });

            await newUser.save();

            // Tạo token để phản hồi
            const token = jwt.sign(
                { id: newUser._id, name:newUser.name, email: newUser.email, role: newUser.role, image:newUser.image },
                process.env.JWT_SECRET || "your_secret_key",
                { expiresIn: "1d" }
            );

            console.log(newUser);

            res.status(201).json({
                token,
            });
        } catch (error) {
            res.status(500).json({ message: "Internal server error.", error });
        }
    };

    static async loginUser(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;

        try {
            // Kiểm tra email
            const user = await UserModel.findOne({ email });
            if (!user) {
                res.status(401).json({ message: "Invalid email or password" });
                return;
            }

            // Kiểm tra mật khẩu
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                res.status(401).json({ message: "Invalid email or password" });
                return;
            }

            // Tạo JWT token
            const token = jwt.sign(
                { id: user._id, role: user.role, name:user.name, email: user.email },
                process.env.JWT_SECRET || "your_secret_key",
                { expiresIn: "1d" }
            );

            res.status(200).json({token });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async updateUser(req: Request, res: Response): Promise<void> {
        const token = req.header('Authorization')?.replace('Bearer ', ''); // Lấy token từ header

        if (!token) {
            res.status(401).json({ message: "Authentication token is required." });
            return;
        }

        try {
            // Xác thực token
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");

            //Tìm người dùng trong cơ sở dữ liệu
            const user = await UserModel.findById(decoded.id);
            if (!user) {
                res.status(404).json({ message: "User not found." });
                return;
            }

            // Xóa ảnh cũ nếu có ảnh mới được upload
            const newFilePath = handleFileUpload(req, "/upload/user");
            let image:string | undefined;
            if (newFilePath) {
                if (user.image) {
                    const absoluteOldFilePath = path.join(__dirname, "../../public", user.image.replace("https://scientific-research-be1.vercel.app/", ""));
                    deleteFile(absoluteOldFilePath); // Xóa ảnh cũ
                }
                image = newFilePath; // Cập nhật đường dẫn ảnh mới
            }

            // Cập nhật name và image
            if (req.body.name) user.name = req.body.name;
            if (image) user.image = image;

            // Lưu người dùng đã cập nhật
            await user.save();

            // Tạo JWT token
            const tokenNew = jwt.sign(
                { id: user._id, role: user.role, name:req.body.name, email: user.email, image:image?image:user.image },
                process.env.JWT_SECRET || "your_secret_key",
                { expiresIn: "1d" }
            );

            // Trả về thông tin người dùng đã được cập nhật
            res.status(200).json({ message: "User updated successfully", token:tokenNew});

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async changePassword(req: Request, res: Response): Promise<void> {
        const token = req.header('Authorization')?.replace('Bearer ', ''); // Lấy token từ header

        if (!token) {
            res.status(401).json({ message: "Authentication token is required." });
            return;
        }

        try {
            // Xác thực token
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");

            // Tìm người dùng trong cơ sở dữ liệu
            const user = await UserModel.findById(decoded.id);
            if (!user) {
                res.status(404).json({ message: "User not found." });
                return;
            }

            const { oldPassword, password } = req.body;

            // Kiểm tra xem oldPassword có đúng không
            const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
            if (!isPasswordValid) {
                res.status(400).json({ message: "Old password is incorrect." });
                return;
            }

            // Hash mật khẩu mới
            const hashedNewPassword = await bcrypt.hash(password, 10);

            // Cập nhật mật khẩu
            user.password = hashedNewPassword;
            await user.save();

            // Trả về phản hồi thành công
            res.status(200).json({ message: "Password changed successfully." });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error });
        }
    }
}
