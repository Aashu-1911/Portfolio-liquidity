const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const authRouter = require("./routes/authRoutes");

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (env.frontendOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "auth-backend" });
});

app.use("/api/auth", authRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

module.exports = app;
