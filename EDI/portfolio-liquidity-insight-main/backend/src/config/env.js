const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const parseFrontendOrigins = () => {
  const configured = process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN;

  if (!configured) {
    return ["http://localhost:8080", "http://127.0.0.1:8080"];
  }

  return configured
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const env = {
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendOrigins: parseFrontendOrigins(),
};

if (!env.mongoUri) {
  throw new Error("Missing MONGO_URI in backend .env");
}

if (!env.jwtSecret) {
  throw new Error("Missing JWT_SECRET in backend .env");
}

module.exports = env;
