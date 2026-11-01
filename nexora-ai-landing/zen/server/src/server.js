import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`ZEN AI server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start ZEN AI:", error);
    process.exit(1);
  }
};

startServer();