import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: { type: String, required: true },

    // email verification fields
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);