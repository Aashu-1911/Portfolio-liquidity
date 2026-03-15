const app = require("./app");
const env = require("./config/env");
const { connectDatabase } = require("./config/db");

const startServer = async () => {
  try {
    await connectDatabase(env.mongoUri);

    app.listen(env.port, () => {
      console.log(`Auth backend running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start auth backend:", error);
    process.exit(1);
  }
};

startServer();
