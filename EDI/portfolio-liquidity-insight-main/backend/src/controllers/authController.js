const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signAuthToken } = require("../services/tokenService");

const sanitizeUser = (userDoc) => ({
  id: userDoc._id.toString(),
  name: userDoc.name,
  email: userDoc.email,
  createdAt: userDoc.createdAt,
});

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
    });

    const token = signAuthToken(user._id.toString());

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Server error while creating account." });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signAuthToken(user._id.toString());

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error while logging in." });
  }
};

const me = async (req, res) => {
  return res.status(200).json({ user: sanitizeUser(req.user) });
};

module.exports = {
  register,
  login,
  me,
};
