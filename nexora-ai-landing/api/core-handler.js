import app from "../backend/src/app.js";
import connectDB from "../backend/src/config/db.js";

let databaseReady;

export default async function handler(request, response) {
  try {
    const incoming = new URL(request.url, "http://vercel.local");
    const route = request.query?.path ?? incoming.searchParams.get("path") ?? "";
    const routePath = (Array.isArray(route) ? route.join("/") : String(route)).replace(/^\/+|\/+$/g, "");
    incoming.searchParams.delete("path");
    request.url = `/api/${routePath}${incoming.search}`;

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