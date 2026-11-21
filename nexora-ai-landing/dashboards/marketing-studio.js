document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("marketingKitForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const API_URL = `${window.BusinessGrowthAPI.zen}/chat`;
  let generatedText = "";
  let mediaPreviewUrl = "";

  function showMediaPreview(file) {
    const container = $("marketingMediaPreview");
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    container.replaceChildren();
    if (!file) { container.hidden = true; return; }
    if (file.size > 25 * 1024 * 1024) {
      $("marketingKitStatus").textContent = "Choose an image or video under 25 MB.";
      $("marketingMedia").value = "";
      container.hidden = true;
      return;
    }
    mediaPreviewUrl = URL.createObjectURL(file);
    const preview = file.type.startsWith("image/") ? document.createElement("img") : document.createElement("video");
    preview.src = mediaPreviewUrl;
    preview.alt = file.type.startsWith("image/") ? "Selected product image preview" : "Selected product video preview";
    if (preview.tagName === "VIDEO") { preview.controls = true; preview.muted = true; }
    const name = document.createElement("span"); name.textContent = `${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    container.append(preview, name);
    container.hidden = false;
  }

  $("marketingMedia").addEventListener("change", (event) => showMediaPreview(event.target.files?.[0]));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const token = sessionStorage.getItem("businessGrowthToken");
    if (!token) { $("marketingKitStatus").textContent = "Sign in to generate a campaign kit."; return; }

    const name = $("marketingProductName").value.trim();
    const description = $("marketingProductDescription").value.trim();
    const audience = $("marketingAudience").value.trim();
    if (!name || !description || !audience) { $("marketingKitStatus").textContent = "Add the product name, description, and target audience."; return; }

    const prompt = `Create a practical campaign kit for this digital product. Use only the facts provided. Do not invent features, testimonials, statistics, income claims, or guarantees. Mark anything that needs owner confirmation.\n\nPRODUCT\nName: ${name}\nDescription: ${description}\nTarget audience: ${audience}\nGoal: ${$("marketingGoal").value}\nPrimary channel: ${$("marketingChannel").value}\nBrand tone: ${$("marketingTone").value}\n\nReturn these sections with clear headings:\n1. Positioning and one-sentence value proposition\n2. Three short hooks\n3. Paid ad copy for the selected channel, including headline and CTA\n4. One organic social post\n5. A 30-second product video script with timestamps, visuals, voiceover, and on-screen text\n6. A text-to-video generation prompt describing the product, scenes, pacing, and aspect ratio\n7. A short checklist of claims the owner should verify before publishing.`;

    const button = $("generateMarketingKit");
    const status = $("marketingKitStatus");
    button.disabled = true;
    button.innerHTML = '<i class="bi bi-hourglass-split"></i> Creating your kit…';
    status.textContent = "ZEN is preparing your campaign kit. This uses your AI plan tokens.";
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: prompt, persona: window.ZenPreferences?.getPersona?.() || "neutral" }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || "ZEN could not create the campaign kit.");
      generatedText = result.reply || "ZEN returned an empty response.";
      $("marketingKitOutput").textContent = generatedText;
      $("marketingKitOutput").hidden = false;
      $("marketingKitEmpty").hidden = true;
      $("copyMarketingKit").disabled = false;
      status.textContent = `Campaign kit ready${result.usage?.tokens ? ` · ${result.usage.tokens} tokens used` : ""}. Review claims before publishing.`;
    } catch (error) {
      status.textContent = error.message || "Could not create the campaign kit. Check that ZEN is running on port 5000.";
    } finally {
      button.disabled = false;
      button.innerHTML = '<i class="bi bi-stars"></i> Generate campaign kit';
    }
  });

  $("copyMarketingKit").addEventListener("click", async () => {
    if (!generatedText) return;
    try { await navigator.clipboard.writeText(generatedText); $("marketingKitStatus").textContent = "Campaign kit copied."; }
    catch { $("marketingKitStatus").textContent = "Clipboard access is unavailable in this browser."; }
  });

  $("viewMarketingPlans").addEventListener("click", () => window.showDashboardSection?.("AI Plans"));
  window.addEventListener("beforeunload", () => { if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl); });
});
