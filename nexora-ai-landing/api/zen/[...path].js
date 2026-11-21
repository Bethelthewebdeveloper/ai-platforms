import app from "../../zen/server/src/app.js";
import connectDB from "../../zen/server/src/config/db.js";

let databaseReady;

export default async function handler(request, response) {
  try {
    databaseReady ||= connectDB().catch((error) => {
      databaseReady = null;
      throw error;
    });
    await databaseReady;
    request.url = request.url.replace(/^\/api\/zen(?=\/|$)/, "/api");
    return app(request, response);
  } catch (error) {
    console.error("ZEN API startup failed:", error.message);
    return response.status(503).json({ success: false, message: "ZEN services are temporarily unavailable." });
  }
}