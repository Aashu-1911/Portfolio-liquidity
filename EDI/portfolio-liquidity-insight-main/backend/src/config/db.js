const mongoose = require("mongoose");

const connectDatabase = async (mongoUri) => {
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
};

module.exports = { connectDatabase };
