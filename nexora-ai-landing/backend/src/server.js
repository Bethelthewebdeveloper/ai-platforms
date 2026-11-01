import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `BusinessGrowth server running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start BusinessGrowth:", error.message);
    process.exit(1);
  }
};

startServer();