import { connect } from "mongoose";
import { UserModel } from "../src/models/user";
import { ResearchModel } from "../src/models/research";
import { RatingModel } from "../src/models/rating";

const seedDatabase = async () => {
  try {
    await connect("mongodb://localhost:27017/scientific-research");

    // Thêm dữ liệu mẫu cho User
    const user = await UserModel.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "password",
      role: "admin",
    });

    // Thêm dữ liệu mẫu cho Research
    const research = await ResearchModel.create({
      title: "Research Title",
      abstract: "This is a sample abstract.",
      author: user._id,
    });

    // Thêm dữ liệu mẫu cho Rating
    await RatingModel.create({
      research: research._id,
      user: user._id,
      score: 5,
      comment: "Great research!",
    });

    console.log("Database seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
