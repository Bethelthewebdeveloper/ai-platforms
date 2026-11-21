(() => {
  const form = document.getElementById("zenChatForm");
  if (!form) return;
  const mode = document.getElementById("zenMediaMode");
  const fileInput = document.getElementById("zenMediaFile");
  const fileName = document.getElementById("zenMediaFileName");
  const promptInput = document.getElementById("zenMessageInput");
  const messages = document.getElementById("zenMessages");
  const sendButton = document.getElementById("zenSendButton");
  const api = window.BusinessGrowthAPI?.zen || "/api/zen";
  let selectedFile = null;
  const activeSpeech = new WeakMap();

  function addSpeechControl(message) {
    const content = message.querySelector(".zen-message-content");
    if (!content || message.dataset.speechAdded) return;
    message.dataset.speechAdded = "true";
    const speak = document.createElement("button");
    speak.type = "button";
    speak.className = "zen-speak-button";
    speak.setAttribute("aria-label", "Read this response aloud");
    speak.title = "Read aloud";
    speak.innerHTML = '<i class="bi bi-volume-up"></i> Read aloud';
    speak.dataset.speechText = content.textContent;
    message.appendChild(speak);
  }
  const speechObserver = new MutationObserver((changes) => changes.forEach((change) => change.addedNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.matches?.(".zen-message.assistant")) addSpeechControl(node);
    node.querySelectorAll?.(".zen-message.assistant").forEach(addSpeechControl);
  })));
  if (messages) speechObserver.observe(messages, { childList: true, subtree: true });

  fileInput?.addEventListener("change", () => {
    selectedFile = fileInput.files?.[0] || null;
    if (selectedFile && mode?.value === "chat") {
      mode.value = "analyze";
      mode.dispatchEvent(new Event("change"));
    }
    if (fileName) fileName.textContent = selectedFile?.name || "Add image or video";
  });
  mode?.addEventListener("change", () => {
    const attachment = form.querySelector(".zen-media-file-button");
    if (attachment) attachment.hidden = mode.value === "image";
    if (fileName && !selectedFile) fileName.textContent = mode.value === "video" ? "Reference image (optional)" : "Add image or video";
    if (mode.value === "chat" || mode.value === "image") {
      selectedFile = null;
      if (fileInput) fileInput.value = "";
    }
  });
  mode?.dispatchEvent(new Event("change"));

  function addText(role, text) {
    messages?.querySelector(".zen-welcome")?.remove();
    const item = document.createElement("div");
    item.className = `zen-message ${role}`;
    const label = document.createElement("span");
    label.className = "zen-message-label";
    label.textContent = role === "user" ? "You" : "ZEN";
    const content = document.createElement("div");
    content.className = "zen-message-content";
    content.textContent = text;
    item.append(label, content);
    messages?.appendChild(item);
    if (role === "assistant") addSpeechControl(item);
    if (messages) messages.scrollTop = messages.scrollHeight;
    return item;
  }

  async function fileToDataUrl(file) {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      let compressed = canvas.toDataURL("image/jpeg", 0.78);
      if (compressed.length > 3_500_000) compressed = canvas.toDataURL("image/jpeg", 0.62);
      if (compressed.length > 4_000_000) throw new Error("This image is too detailed to upload. Try a smaller image.");
      return compressed;
    } catch (error) {
      if (error.message?.includes("too detailed")) throw error;
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read that image."));
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }
  }

  async function sampleVideo(file) {
    const url = URL.createObjectURL(file);
    try {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.src = url;
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = () => reject(new Error("This video could not be opened in your browser."));
      });
      if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Error("This video has no readable duration.");
      if (video.readyState < 2) await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = () => reject(new Error("This video has no readable frames."));
      });
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 768 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const ctx = canvas.getContext("2d");
      const times = [...new Set([0, video.duration / 2, Math.max(0, video.duration - 0.1)])];
      const frames = [];
      for (const timestamp of times) {
        if (Math.abs(video.currentTime - timestamp) >= 0.01 || video.readyState < 2) {
          await new Promise((resolve, reject) => {
            video.onseeked = resolve;
            video.onerror = () => reject(new Error("Could not read a video frame."));
            video.currentTime = timestamp;
          });
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push({ timestamp, dataUrl: canvas.toDataURL("image/jpeg", 0.62) });
      }
      return frames;
    } finally { URL.revokeObjectURL(url); }
  }

  async function readResponse(response, contentType) {
    if (!response.ok) {
      let error = {};
      try { error = await response.json(); } catch {}
      throw new Error(error.message || "ZEN could not complete that request.");
    }
    return response.blob().then((blob) => new Blob([blob], { type: response.headers.get("content-type") || contentType }));
  }

  async function readJsonResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      await response.text();
      throw new Error("The ZEN server does not have the media API loaded. Stop the old ZEN server, run npm run start:zen from the project folder, then reload this dashboard.");
    }
    try { return await response.json(); }
    catch { throw new Error("ZEN returned an unreadable response. Restart the ZEN server and try again."); }
  }

  function choosePersonaVoice(voices, persona, language) {
    const target = persona === "female" ? "female" : ["male", "gay_man"].includes(persona) ? "male" : "neutral";
    const lang = (language || "en-US").toLowerCase();
    const feminine = /female|woman|samantha|victoria|zira|hazel|susan|karen|moira|tessa|serena|aria|jenny|ava|sara|sophie|linda|heera/;
    const masculine = /\bmale\b|\bman\b|david|mark|alex|daniel|james|thomas|fred|jorge|tom|aaron|oliver|rishi|guy|ryan|eric|george|lee/;
    const ranked = voices.map((voice) => {
      const voiceName = `${voice.name} ${voice.gender || ""}`.toLowerCase();
      let score = voice.lang?.toLowerCase() === lang ? 8 : voice.lang?.toLowerCase().startsWith(lang.split("-")[0]) ? 4 : 0;
      if (target === "female" && feminine.test(voiceName)) score += 20;
      if (target === "male" && masculine.test(voiceName)) score += 20;
      if (target === "neutral" && /neutral|default|natural/.test(voiceName)) score += 8;
      if (voice.default) score += 1;
      return { voice, score, personaMatch: target === "female" ? feminine.test(voiceName) : target === "male" ? masculine.test(voiceName) : true };
    }).sort((a, b) => b.score - a.score);
    const match = ranked.find((item) => item.personaMatch && item.score > 0);
    return match?.voice || (target === "neutral" ? ranked[0]?.voice : null) || null;
  }

  form.addEventListener("submit", async (event) => {
    if (!mode || mode.value === "chat") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const selectedMode = mode.value;
    const prompt = promptInput?.value.trim() || "Describe what you see and give me the key details.";
    const token = sessionStorage.getItem("businessGrowthToken");
    if (!token) { addText("assistant", "Please sign in again to use ZEN media tools."); return; }
    if (selectedMode === "analyze" && !selectedFile) { addText("assistant", "Choose an image or a video to analyze."); return; }
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024 && selectedFile.type.startsWith("image/")) { addText("assistant", "Images must be 5 MB or smaller."); return; }
    if (selectedFile?.type.startsWith("video/") && selectedFile.size > 100 * 1024 * 1024) { addText("assistant", "Videos must be 100 MB or smaller for analysis."); return; }
    addText("user", selectedFile ? `${prompt}\n[${selectedFile.name}]` : prompt);
    if (promptInput) promptInput.value = "";
    if (sendButton) sendButton.disabled = true;
    const typing = addText("assistant", selectedMode === "video" ? "ZEN is creating your video. This can take a few minutes..." : "ZEN is working on that...");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      let response;
      if (selectedMode === "analyze") {
        const payload = { prompt };
        if (selectedFile.type.startsWith("video/")) {
          if (!["video/mp4", "video/webm", "video/quicktime"].includes(selectedFile.type)) throw new Error("Choose an MP4, WebM, or MOV video.");
          payload.frames = await sampleVideo(selectedFile);
        } else {
          if (!["image/png", "image/jpeg", "image/webp"].includes(selectedFile.type)) throw new Error("Choose a PNG, JPEG, or WebP image, or an MP4, WebM, or MOV video.");
          payload.image = await fileToDataUrl(selectedFile);
        }
        response = await fetch(`${api}/media/analyze`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const result = await readJsonResponse(response);
        if (!response.ok || !result.success) throw new Error(result.message || "ZEN could not analyze the media.");
        typing.remove(); addText("assistant", result.reply);
      } else {
        const endpoint = selectedMode === "image" ? "image" : "video";
        const payload = { prompt };
        if (selectedMode === "video" && selectedFile) {
          if (!selectedFile.type.startsWith("image/")) throw new Error("For video generation, attach an optional PNG, JPEG, or WebP reference image.");
          if (selectedFile.size > 5 * 1024 * 1024) throw new Error("Reference images must be 5 MB or smaller.");
          payload.image = await fileToDataUrl(selectedFile);
        }
        response = await fetch(`${api}/media/${endpoint}`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const blob = await readResponse(response, selectedMode === "image" ? "image/png" : "video/mp4");
        typing.remove();
        const url = URL.createObjectURL(blob);
        const item = document.createElement("div"); item.className = "zen-message assistant";
        const label = document.createElement("span"); label.className = "zen-message-label"; label.textContent = "ZEN"; item.appendChild(label);
        const preview = selectedMode === "image" ? document.createElement("img") : document.createElement("video");
        preview.src = url; preview.className = "zen-generated-media"; preview.alt = "Image generated by ZEN";
        if (preview instanceof HTMLVideoElement) { preview.controls = true; preview.alt = "Video generated by ZEN"; }
        const download = document.createElement("a"); download.href = url; download.download = selectedMode === "image" ? "zen-generated-image.png" : "zen-generated-video.mp4"; download.textContent = "Download"; download.className = "zen-media-download";
        item.append(preview, download); messages?.appendChild(item); if (messages) messages.scrollTop = messages.scrollHeight;
      }
      window.dispatchEvent(new Event("ai-usage-updated"));
    } catch (error) { typing.remove(); addText("assistant", error.message || "ZEN could not complete that media request."); }
    finally {
      selectedFile = null;
      if (fileInput) fileInput.value = "";
      if (fileName) fileName.textContent = "Add media";
      if (sendButton) sendButton.disabled = false;
      promptInput?.focus();
    }
  }, true);

  messages?.addEventListener("click", async (event) => {
    const button = event.target.closest(".zen-speak-button");
    if (!button) return;
    const persona = window.ZenPreferences?.getPersona?.() || "neutral";
    if (activeSpeech.has(button)) {
      activeSpeech.get(button)();
      activeSpeech.delete(button);
      button.disabled = false;
      button.dataset.speaking = "false";
      button.innerHTML = '<i class="bi bi-volume-up"></i> Read aloud';
      return;
    }
    button.disabled = true;
    button.textContent = "Preparing voice...";
    const resetButton = () => {
      button.disabled = false;
      button.dataset.speaking = "false";
      activeSpeech.delete(button);
      button.innerHTML = '<i class="bi bi-volume-up"></i> Read aloud';
    };
    try {
      const token = sessionStorage.getItem("businessGrowthToken");
      if (!token) throw new Error("Please sign in again to use ZEN voice.");
      const response = await fetch(`${api}/media/speech`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: button.dataset.speechText, persona }),
      });
      const blob = await readResponse(response, "audio/mpeg");
      const audio = new Audio(URL.createObjectURL(blob));
      button.disabled = false;
      button.dataset.speaking = "true";
      button.innerHTML = '<i class="bi bi-stop-fill"></i> Stop reading';
      activeSpeech.set(button, () => audio.pause());
      audio.addEventListener("ended", resetButton, { once: true });
      audio.addEventListener("error", resetButton, { once: true });
      await audio.play();
    } catch (error) {
      resetButton();
      if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
        button.textContent = error.message || "Speech is not supported by this browser";
        return;
      }
      const utterance = new SpeechSynthesisUtterance(button.dataset.speechText || "");
      utterance.lang = navigator.language || "en-US";
      const voice = choosePersonaVoice(window.speechSynthesis.getVoices(), persona, utterance.lang);
      if (voice) {
        utterance.voice = voice;
        button.dataset.speaking = "true";
        button.innerHTML = '<i class="bi bi-stop-fill"></i> Stop reading';
        utterance.onend = resetButton;
        utterance.onerror = resetButton;
        activeSpeech.set(button, () => window.speechSynthesis.cancel());
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } else {
        button.textContent = `No ${persona === "female" ? "female" : "male"} voice is available. Check the ZEN AI Gateway key or install a matching voice in your device settings.`;
      }
    }
  });
})();
