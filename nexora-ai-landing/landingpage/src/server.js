require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { runAgent, listTools } = require("./agent");

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);
const publicDir = path.join(__dirname, "../public");

app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "BusinessGrowth AI Agent",
    modelConfigured: Boolean(process.env.OPENAI_API_KEY || process.env.OPENAI_BASE_URL),
    time: new Date().toISOString(),
  });
});

app.get("/api/tools", (req, res) => {
  res.json({ tools: listTools() });
});

/**
 * POST /api/agent/run
 * body: { toolName: string, request: string }
 */
app.post("/api/agent/run", async (req, res) => {
  try {
    const { toolName, request, tool } = req.body || {};
    const result = await runAgent({
      toolName: toolName || tool,
      request,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      ok: false,
      error: err.message || "Agent failed",
    });
  }
});

app.use(express.static(publicDir));

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`BusinessGrowth AI Agent → http://localhost:${PORT}`);
  console.log(`API: POST http://localhost:${PORT}/api/agent/run`);
  if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_BASE_URL) {
    console.log("Running in deterministic mode (no OPENAI_API_KEY / OPENAI_BASE_URL).");
  }
});
