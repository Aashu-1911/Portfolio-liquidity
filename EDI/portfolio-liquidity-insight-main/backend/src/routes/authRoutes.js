const express = require("express");
const { register, login, me } = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, me);

module.exports = authRouter;
