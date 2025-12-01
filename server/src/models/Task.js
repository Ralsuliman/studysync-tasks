// server/src/models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    // which user owns this task
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    dueDate: {
      type: Date,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    assignedTo: {
      type: String,
      default: "",
      trim: true,
    },

    // NEW: course/group this task belongs to
    course: {
      type: String,
      enum: ["CS335", "CS101", "IT202"],
      default: "CS335",
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);