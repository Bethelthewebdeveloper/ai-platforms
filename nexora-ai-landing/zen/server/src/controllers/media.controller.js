import { experimental_generateVideo, experimental_generateSpeech, generateImage, generateText } from "ai";
import { getActualTokenCount, recordApiUsage } from "./developer.controller.js";

const modelFor = (env, fallback) => process.env[env] || fallback;
const charge = async (req, name, fallback) => recordApiUsage(req, Number(process.env[name]) || fallback);
const textField = (value, max = 4000) => typeof value === "string" ? value.trim().slice(0, max) : "";
const dataUrl = (value, allowed, maxChars = 8_000_000) => {
  if (typeof value !== "string" || value.length > maxChars) return null;
  const match = value.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/i);
  return match && allowed.includes(match[1].toLowerCase()) ? { mediaType: match[1].toLowerCase(), data: match[2] } : null;
};
const imageData = (entry) => ({ type: "image", image: Buffer.from(entry.data, "base64"), mediaType: entry.mediaType });

export async function analyzeMedia(req, res) {
  const prompt = textField(req.body?.prompt, 2000) || "Describe this media and answer helpfully.";
  const image = dataUrl(req.body?.image, ["image/png", "image/jpeg", "image/webp"]);
  const frames = Array.isArray(req.body?.frames) ? req.body.frames.slice(0, 4).map((frame) => ({ frame, parsed: dataUrl(frame?.dataUrl, ["image/png", "image/jpeg", "image/webp"], 2_000_000) })).filter((item) => item.parsed) : [];
  if (!image && !frames.length) return res.status(400).json({ success: false, message: "Choose an image or video to analyze." });
  try {
    const mediaParts = image ? [imageData(image)] : frames.flatMap(({ frame, parsed }) => [{ type: "text", text: `Video frame at ${Number(frame.timestamp || 0).toFixed(1)} seconds:` }, imageData(parsed)]);
    const result = await generateText({
      model: modelFor("AI_GATEWAY_VISION_MODEL", "google/gemini-2.5-flash"),
      system: "You are ZEN. Analyze the supplied image or sampled video frames. Describe only what is visible; mention uncertainty and do not claim to inspect video audio.",
      messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...mediaParts] }],
      maxOutputTokens: 1500,
    });
    const usage = await recordApiUsage(req, getActualTokenCount(result, prompt));
    return res.json({ success: true, reply: result.text, usage });
  } catch (error) { return mediaError(res, error); }
}

export async function createImage(req, res) {
  const prompt = textField(req.body?.prompt, 2000);
  if (!prompt) return res.status(400).json({ success: false, message: "Describe the image you want ZEN to create." });
  try {
    const result = await generateImage({ model: modelFor("AI_GATEWAY_IMAGE_MODEL", "openai/gpt-image-2"), prompt, n: 1, aspectRatio: "1:1" });
    const image = result.images?.[0];
    if (!image) throw new Error("The image model returned no image.");
    await charge(req, "AI_IMAGE_GENERATION_TOKENS", 1000);
    res.set("Content-Type", image.mediaType || "image/png").set("Cache-Control", "no-store").send(Buffer.from(image.uint8Array));
  } catch (error) { return mediaError(res, error); }
}

export async function createVideo(req, res) {
  const prompt = textField(req.body?.prompt, 2000);
  if (!prompt) return res.status(400).json({ success: false, message: "Describe the video you want ZEN to create." });
  const reference = dataUrl(req.body?.image, ["image/png", "image/jpeg", "image/webp"]);
  if (req.body?.image && !reference) return res.status(400).json({ success: false, message: "Use a PNG, JPEG, or WebP reference image under 5 MB." });
  try {
    const result = await experimental_generateVideo({
      model: modelFor("AI_GATEWAY_VIDEO_MODEL", "google/veo-3.1-fast-generate-001"),
      prompt: reference ? { image: Buffer.from(reference.data, "base64"), text: prompt } : prompt,
      n: 1, duration: 8, aspectRatio: "16:9", resolution: "1280x720", poll: { timeoutMs: 600000 },
    });
    if (!result.video) throw new Error("The video model returned no video.");
    await charge(req, "AI_VIDEO_GENERATION_TOKENS", 5000);
    res.set("Content-Type", result.video.mediaType || "video/mp4").set("Cache-Control", "no-store").send(Buffer.from(result.video.uint8Array));
  } catch (error) { return mediaError(res, error); }
}

export async function speak(req, res) {
  const text = textField(req.body?.text, 4000);
  if (!text) return res.status(400).json({ success: false, message: "There is no text to speak." });
  const voices = { neutral: "alloy", male: "onyx", female: "nova", gay_man: "onyx" };
  const voice = voices[req.body?.persona] || voices.neutral;
  try {
    const result = await experimental_generateSpeech({ model: modelFor("AI_GATEWAY_SPEECH_MODEL", "openai/gpt-4o-mini-tts"), text, voice, outputFormat: "mp3" });
    await charge(req, "AI_SPEECH_GENERATION_TOKENS", Math.max(1, Math.ceil(text.length / 4)));
    res.set("Content-Type", result.audio.mediaType || "audio/mpeg").set("Cache-Control", "no-store").send(Buffer.from(result.audio.uint8Array));
  } catch (error) { return mediaError(res, error); }
}

function mediaError(res, error) {
  console.error("ZEN media error:", error);
  if (/token allowance exhausted|token limit/i.test(error.message)) return res.status(402).json({ success: false, message: error.message });
  const status = Number(error.statusCode || error.status);
  return res.status(status >= 400 && status < 500 ? status : 503).json({ success: false, message: error.message || "ZEN could not complete that media request. Check your AI provider configuration and try again." });
}
