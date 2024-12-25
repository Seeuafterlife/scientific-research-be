import { Request, Response } from "express";
import { ResearchModel } from "../models/research";
import { createUploadMiddleware, deleteFile, handleFileUpload } from "../service/upload-image";
import path from 'path';
import jwt from "jsonwebtoken";
import { RatingModel } from "../models/rating";

interface RequestWithId extends Request {
    params: { id: string };
}

const uploadDir = path.join(__dirname, '../../public/upload/research');
export const uploadMiddleware = createUploadMiddleware(uploadDir).single('file');

export class ResearchController {
    static async createResearch(req: Request, res: Response) {
        const token = req.header('Authorization')?.replace('Bearer ', ''); // Lấy token từ header

        if (!token) {
            res.status(401).json({ message: "Authentication token is required." });
            return;
        }

        try {
            // Xử lý file upload để lấy đường dẫn
            const filePath = handleFileUpload(req, "/upload/research");
            if (!filePath) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            // Gán đường dẫn ảnh vào req.body
            req.body.image = filePath;

            // Tạo research mới với dữ liệu từ body
            const research = await ResearchModel.create(req.body);

            // Trả về kết quả
            res.status(200).json({ message: "Research created successfully" });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    static async getAllResearch(req: Request, res: Response) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', ''); // Lấy token từ header
            // Lấy danh sách research
            const researchList = await ResearchModel.find();

            if (token) {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");

                // Nếu có id, kiểm tra bảng Rating
                const researchWithRating = await Promise.all(
                    researchList.map(async (research) => {
                        // Kiểm tra user (id) và research có trong bảng Rating
                        const ratingExists = await RatingModel.exists({
                            user: decoded.id,
                            research: research._id,
                        });

                        // Thêm trường isRating tạm thời vào kết quả
                        return {
                            ...research.toObject(), // Chuyển document thành object
                            isRating: !!ratingExists, // true nếu tồn tại rating, false nếu không
                        };
                    })
                );

                return res.json(researchWithRating);
            }

            res.json(researchList);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    static async getRatedResearch(req: Request, res: Response) {
        const token = req.header('Authorization')?.replace('Bearer ', ''); // Lấy token từ header
        const { title } = req.query; // Lấy từ khóa từ query parameters

        if (title===undefined) {
            return res.status(400).json({ error: "Title query parameter is required" });
        }

        if (!token) {
            res.status(401).json({ message: "Authentication token is required." });
            return;
        }

        try {
            // Xác thực token
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");

            // Tìm các rating có userId
            const ratings = await RatingModel.find({ user: decoded.id }).populate('research');

            // Duyệt qua danh sách rating và xử lý
            const researchList = ratings.map((rating) => {
                // Kiểm tra nếu research là document đầy đủ
                if (
                    rating.research &&
                    typeof rating.research === 'object' &&
                    'toObject' in rating.research
                ) {
                    return {
                        ...rating.research.toObject(),
                        isRating: true,
                    };
                }

                return null; // Xử lý trường hợp không hợp lệ
            }).filter(Boolean); // Loại bỏ null

            const result=researchList.filter((research)=>research.title.includes(title));

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    static async searchResearchByTitle(req: Request, res: Response) {
        try {
            const { title } = req.query; // Lấy từ khóa từ query parameters
            const token = req.header('Authorization')?.replace('Bearer ', ''); // Lấy token từ header

            if (title===undefined) {
                return res.status(400).json({ error: "Title query parameter is required" });
            }

            // Tìm kiếm nghiên cứu theo tiêu đề (không phân biệt hoa thường)
            const researchList = await ResearchModel.find({
                title: { $regex: title, $options: "i" } // Tìm kiếm tiêu đề chứa từ khóa, không phân biệt hoa thường
            });

            if (token) {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");

                // Nếu có id, kiểm tra bảng Rating
                const researchWithRating = await Promise.all(
                    researchList.map(async (research) => {
                        // Kiểm tra user (id) và research có trong bảng Rating
                        const ratingExists = await RatingModel.exists({
                            user: decoded.id,
                            research: research._id,
                        });

                        // Thêm trường isRating tạm thời vào kết quả
                        return {
                            ...research.toObject(), // Chuyển document thành object
                            isRating: !!ratingExists, // true nếu tồn tại rating, false nếu không
                        };
                    })
                );

                return res.json(researchWithRating);
            }

            res.status(200).json(researchList);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    static async getResearchById(req: RequestWithId, res: Response) {
        try {
            const research = await ResearchModel.findById(req.params.id);
            if (!research) {
                return res.status(404).json({ message: "Research not found" });
            }
            res.json(research);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    static async updateResearch(req: RequestWithId, res: Response) {
        const token = req.header('Authorization')?.replace('Bearer ', ''); // Lấy token từ header

        if (!token) {
            res.status(401).json({ message: "Authentication token is required." });
            return;
        }

        try {
            const existingResearch = await ResearchModel.findById(req.params.id);

            if (!existingResearch) {
                return res.status(404).json({ message: "Research not found" });
            }

            // Xóa ảnh cũ nếu có ảnh mới được upload
            const newFilePath = handleFileUpload(req, "/upload/research");
            if (newFilePath) {
                if (existingResearch.image) {
                    const absoluteOldFilePath = path.join(__dirname, "../../public", existingResearch.image.replace("http://localhost:5000", ""));
                    deleteFile(absoluteOldFilePath); // Xóa ảnh cũ
                }
                req.body.image = newFilePath; // Cập nhật đường dẫn ảnh mới
            }

            // Lọc các trường hợp lệ
            const updateFields: Partial<typeof req.body> = {
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
            const updatedResearch = await ResearchModel.findByIdAndUpdate(req.params.id, updateFields, { new: true });

            res.status(200).json({ message: "Research updated successfully" });;
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    static async deleteResearch(req: Request, res: Response) {
        const token = req.header('Authorization')?.replace('Bearer ', ''); // Lấy token từ header

        if (!token) {
            res.status(401).json({ message: "Authentication token is required." });
            return;
        }

        try {
            const { id } = req.params;

            // Tìm nghiên cứu dựa trên id
            const research = await ResearchModel.findById(id);

            if (!research) {
                return res.status(404).json({ message: "Research not found" });
            }

            // Xóa file ảnh nếu tồn tại
            if (research.image) {
                const absoluteFilePath = path.join(
                    __dirname,
                    "../../public",
                    research.image.replace("http://localhost:5000", "")
                );

                deleteFile(absoluteFilePath);
            }

            // Xóa tài liệu nghiên cứu khỏi cơ sở dữ liệu
            await ResearchModel.findByIdAndDelete(id);

            res.status(200).json({ message: "Research deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }
}
