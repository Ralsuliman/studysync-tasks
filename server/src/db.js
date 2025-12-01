// server/src/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // No extra options needed in modern Mongoose
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;