/**
 * BusinessGrowth AI Agent
 * Six tools matching the frontend cards. Works offline with deterministic
 * templates; uses OpenAI-compatible APIs when OPENAI_API_KEY / local URL is set.
 */

const TOOLS = {
  "AI Business Assistant": {
    id: "business-assistant",
    system:
      "You are a practical business assistant for small and growing companies. Be concise, actionable, and honest. No hype.",
  },
  "AI Content Creator": {
    id: "content-creator",
    system:
      "You write clear marketing and business content. Prefer short paragraphs, concrete benefits, and a soft call to action.",
  },
  "AI Business Insights": {
    id: "business-insights",
    system:
      "You help founders interpret business situations. Separate facts, estimates, and unknowns. Suggest what to measure next.",
  },
  "Workflow Automation": {
    id: "workflow-automation",
    system:
      "You design simple automation plans. Break work into steps, triggers, and safeguards. Prefer low-tech solutions first.",
  },
  "AI Marketing Assistant": {
    id: "marketing-assistant",
    system:
      "You suggest practical marketing ideas for small businesses. Focus on channels they can actually use this week.",
  },
  "Business Growth Planner": {
    id: "growth-planner",
    system:
      "You turn goals into 30-day plans with measurable steps, owners, and review cadence. Be realistic about constraints.",
  },
};

function deterministicReply(toolName, userRequest) {
  const req = userRequest.trim();
  switch (toolName) {
    case "AI Business Assistant":
      return {
        title: "Business Assistant",
        text: [
          `Request: ${req}`,
          "",
          "Suggested approach:",
          "1. Restate the goal in one measurable sentence.",
          "2. List constraints (time, budget, skills).",
          "3. Pick the highest-leverage next action you can finish in 48 hours.",
          "4. Schedule a 15-minute review in one week.",
          "",
          "Tip: Write the next action down and assign a deadline before you leave this page.",
        ].join("\n"),
        method: "deterministic",
      };

    case "AI Content Creator":
      return {
        title: "Content draft",
        text: [
          `Topic: ${req}`,
          "",
          "LinkedIn / post draft:",
          `Most teams struggle with “${req.slice(0, 80)}” because they start too broad.`,
          "",
          "Try this angle: pick one painful moment in the customer’s week, show the before/after, and invite a reply.",
          "",
          "CTA: “What is the first process you would fix?”",
        ].join("\n"),
        method: "deterministic",
      };

    case "AI Business Insights":
      return {
        title: "Insights checklist",
        text: [
          `Focus: ${req}`,
          "",
          "Track weekly:",
          "• Leading: pipeline / leads / activations",
          "• Lagging: revenue / retention",
          "• Quality: customer feedback themes",
          "",
          "Questions to answer this month:",
          "1. Which channel produces the best-qualified interest?",
          "2. Where do customers drop off?",
          "3. What single change would improve the metric you care about most?",
        ].join("\n"),
        method: "deterministic",
      };

    case "Workflow Automation":
      return {
        title: "Automation sketch",
        text: [
          `Task: ${req}`,
          "",
          "Map the process:",
          "1. Trigger – what starts the work?",
          "2. Steps – list every handoff and decision.",
          "3. Rules – what can be decided without a human?",
          "4. Exceptions – when must a person review?",
          "5. Measure – time saved and error rate.",
          "",
          "Start with a checklist or spreadsheet before buying tools.",
        ].join("\n"),
        method: "deterministic",
      };

    case "AI Marketing Assistant":
      return {
        title: "Marketing ideas",
        text: [
          `Offer / focus: ${req}`,
          "",
          "This week:",
          "1. One clear post explaining the problem you solve.",
          "2. A short case note or example (with permission).",
          "3. A direct outreach list of 10 ideal customers.",
          "",
          "Message frame: Problem → outcome → proof → invite.",
        ].join("\n"),
        method: "deterministic",
      };

    case "Business Growth Planner":
      return {
        title: "30-day growth plan",
        text: [
          `Goal: ${req}`,
          "",
          "Week 1 – Clarify: define a measurable target and constraints.",
          "Week 2 – Validate: talk to 5 customers or prospects; note language they use.",
          "Week 3 – Ship: deliver one improvement tied to the goal.",
          "Week 4 – Review: compare results to the target; set the next 30 days.",
          "",
          "Rule: one primary metric, three supporting actions max.",
        ].join("\n"),
        method: "deterministic",
      };

    default:
      return {
        title: "Assistant",
        text: "Unknown tool. Choose one of the six BusinessGrowth AI tools.",
        method: "deterministic",
      };
  }
}

async function generateWithModel(system, userRequest) {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  // Local OpenAI-compatible servers often need no key
  const needsKey = baseUrl.includes("openai.com");
  if (needsKey && !apiKey) return null;

  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userRequest },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Model HTTP ${res.status}: ${errText.slice(0, 180)}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    return {
      text,
      model,
      tokens: {
        in: data.usage?.prompt_tokens || 0,
        out: data.usage?.completion_tokens || 0,
      },
    };
  } catch (err) {
    clearTimeout(timer);
    console.warn("[agent] model call failed:", err.message);
    return null;
  }
}

/**
 * Run the agent for a named tool + user request.
 */
async function runAgent({ toolName, request }) {
  const name = toolName || "AI Business Assistant";
  const userRequest = (request || "").trim();
  if (!userRequest) {
    const err = new Error("request is required");
    err.status = 400;
    throw err;
  }

  const tool = TOOLS[name] || TOOLS["AI Business Assistant"];
  const fallback = deterministicReply(name, userRequest);

  const generated = await generateWithModel(tool.system, userRequest);
  if (generated) {
    return {
      ok: true,
      tool: name,
      toolId: tool.id,
      title: fallback.title,
      reply: generated.text,
      method: "model",
      model: generated.model,
      tokens: generated.tokens,
    };
  }

  return {
    ok: true,
    tool: name,
    toolId: tool.id,
    title: fallback.title,
    reply: fallback.text,
    method: "deterministic",
    model: null,
    tokens: { in: 0, out: 0 },
    note:
      "Deterministic template used. Set OPENAI_API_KEY or OPENAI_BASE_URL for generative replies.",
  };
}

function listTools() {
  return Object.entries(TOOLS).map(([name, t]) => ({
    name,
    id: t.id,
  }));
}

module.exports = { runAgent, listTools, TOOLS };
