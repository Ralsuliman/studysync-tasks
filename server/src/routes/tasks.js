// server/src/routes/tasks.js
import express from "express";
import Task from "../models/Task.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// All task routes require auth
router.use(authRequired);

// GET /api/tasks -> ALL shared tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({}).sort({ createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ error: "Failed to load tasks" });
  }
});

// POST /api/tasks -> create shared task
router.post("/", async (req, res) => {
  try {
    const { title, description, dueDate, priority, assignedTo, course } =
      req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const task = await Task.create({
      userId: req.user.id,
      title: title.trim(),
      description: (description || "").trim(),
      dueDate: dueDate || null,
      priority: priority || "Medium",
      assignedTo: (assignedTo || "").trim(),
      course: course || "CS335",
      completed: false,
    });

    // 🔊 broadcast to all connected clients
    const io = req.app.get("io");
    if (io) {
      io.emit("taskCreated", task);
    }

    res.status(201).json(task);
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: "Failed to add task" });
  }
});

// PUT /api/tasks/:id -> update shared task
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updates = {};

    if ("title" in req.body) updates.title = req.body.title;
    if ("description" in req.body) updates.description = req.body.description;
    if ("dueDate" in req.body) updates.dueDate = req.body.dueDate || null;
    if ("priority" in req.body) updates.priority = req.body.priority;
    if ("assignedTo" in req.body) updates.assignedTo = req.body.assignedTo;
    if ("completed" in req.body) updates.completed = req.body.completed;
    if ("course" in req.body) updates.course = req.body.course;

    const task = await Task.findByIdAndUpdate(id, updates, { new: true });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // 🔊 broadcast update
    const io = req.app.get("io");
    if (io) {
      io.emit("taskUpdated", task);
    }

    res.json(task);
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE /api/tasks/:id -> delete shared task
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Task.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Task not found" });
    }

    // 🔊 broadcast delete (send only id)
    const io = req.app.get("io");
    if (io) {
      io.emit("taskDeleted", { id });
    }

    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;