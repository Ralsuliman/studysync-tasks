// server/src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendVerificationEmail } from "../utils/mailer.js";

const router = express.Router();
const SALT_ROUNDS = 10;

// SAME secret string as before, but allow env override
const JWT_SECRET =
  process.env.JWT_SECRET || "supersecretstudysynckey123";

// Base URL for the API – used to build the verification link
// In Render, set API_BASE_URL=https://studysync-tasks-backend.onrender.com
const API_BASE_URL =
  process.env.API_BASE_URL || "http://localhost:8080";

function createToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// REGISTER with email verification
router.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    email = email.trim().toLowerCase();

    const existing = await User.findOne({ email });

    // CASE 1: email already exists AND is verified → tell user to log in
    if (existing && existing.emailVerified) {
      console.log("Register: email already exists (verified)", email);
      return res
        .status(409)
        .json({ error: "Email already exists. Please log in instead." });
    }

    let user;
    let verificationToken;

    if (existing && !existing.emailVerified) {
      // CASE 2: email exists but NOT verified → reuse user and re-send link
      console.log("Register: email exists but not verified, resending link", email);

      verificationToken =
        existing.verificationToken ||
        crypto.randomBytes(32).toString("hex");

      existing.name = name;
      existing.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      existing.verificationToken = verificationToken;

      user = await existing.save();
    } else {
      // CASE 3: completely new user
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      verificationToken = crypto.randomBytes(32).toString("hex");

      user = await User.create({
        name,
        email,
        passwordHash,
        emailVerified: false,
        verificationToken,
      });
    }

    const verifyLink = `${API_BASE_URL}/api/auth/verify/${verificationToken}`;

    // send the actual email (Ethereal)
    const previewEmailURL = await sendVerificationEmail(
      user.email,
      verifyLink
    );

    res.status(201).json({
      message:
        "Account created! A verification email has been sent. Please verify your email before logging in.",
      previewEmailURL,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed." });
  }
});

// VERIFY endpoint: user clicks link from email
router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification link." });
    }

    user.emailVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "Email verification failed." });
  }
});

// LOGIN (only if emailVerified = true)
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      console.log("Login: user not found for email", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      console.log("Login: password mismatch for", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      console.log("Login: email not verified for", email);
      return res
        .status(403)
        .json({ error: "Please verify your email before logging in." });
    }

    const token = createToken(user);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed." });
  }
});

export default router;