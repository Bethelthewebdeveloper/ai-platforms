import app from "../backend/src/app.js";
import connectDB from "../backend/src/config/db.js";

let databaseReady;

export default async function handler(request, response) {
  try {
    databaseReady ||= connectDB().catch((error) => {
      databaseReady = null;
      throw error;
    });
    await databaseReady;
    return app(request, response);
  } catch (error) {
    console.error("BusinessGrowth API startup failed:", error.message);
    return response.status(503).json({ success: false, message: "BusinessGrowth services are temporarily unavailable." });
  }
}