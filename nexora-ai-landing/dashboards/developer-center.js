document.addEventListener("DOMContentLoaded", () => {
  const planRoot = document.getElementById("aiPlansCenter");
  const integrationRoot = document.getElementById("developerCenter");
  if (!planRoot || !integrationRoot) return;

  const integrationNotice = document.getElementById("integrationConnectNotice");
  const integrationCards = [...document.querySelectorAll(".integration-app-card")];
  const integrationSearch = document.getElementById("integrationSearch");
  const integrationSearchEmpty = document.getElementById("integrationSearchEmpty");
  integrationRoot.querySelectorAll("[data-integration-connect]").forEach((button) => {
    button.addEventListener("click", () => {
      const appName = button.dataset.integrationConnect;
      if (!integrationNotice) return;
      integrationNotice.hidden = false;
      integrationNotice.textContent = `${appName} is in the catalogue preview. Live account authorization and data sync are not enabled yet.`;
      integrationNotice.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
  integrationSearch?.addEventListener("input", () => {
    const query = integrationSearch.value.trim().toLowerCase();
    let visible = 0;
    integrationCards.forEach((card) => {
      const match = `${card.dataset.appName} ${card.dataset.appCategory}`.toLowerCase().includes(query);
      card.hidden = !match;
      if (match) visible += 1;
    });
    if (integrationSearchEmpty) integrationSearchEmpty.hidden = visible > 0;
  });

  const api = `${window.BusinessGrowthAPI.zen}/developer`;
  const token = sessionStorage.getItem("businessGrowthToken");
  const plansNode = document.getElementById("aiPlanCards");
  const usageText = document.getElementById("aiUsageText");
  const progress = document.getElementById("aiUsageProgress");
  const keyList = document.getElementById("apiKeyList");
  const status = document.getElementById("developerCenterStatus");
  const secretNotice = document.getElementById("newApiKeyNotice");

  const request = async (path, options = {}) => {
    const response = await fetch(`${api}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Could not complete the request.");
    return data;
  };

  const formatNumber = (value) => new Intl.NumberFormat().format(value || 0);
  const formatPrice = (kobo) => kobo === 0 ? "Free" : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100);
  const showStatus = (message, error = false) => { status.textContent = message; status.classList.toggle("is-error", error); };

  function render(data) {
    const used = data.usage.used;
    const percentage = data.usage.monthlyLimit ? Math.min(100, Math.round(used / data.usage.monthlyLimit * 100)) : 0;
    usageText.textContent = `${formatNumber(used)} used of ${formatNumber(data.usage.monthlyLimit)} monthly tokens · ${formatNumber(data.usage.remaining)} remaining · resets ${new Date(data.usage.resetsAt).toLocaleDateString()}`;
    progress.value = percentage;
    document.getElementById("aiUsageLabel").textContent = `${data.plan[0].toUpperCase()}${data.plan.slice(1)} plan`;
    const topup = document.getElementById("aiTopupButton");
    topup.textContent = data.tokenPack.checkoutAvailable ? `Buy ${formatNumber(data.tokenPack.tokens)} tokens · ${formatPrice(data.tokenPack.priceKobo)}` : "Token top-up unavailable";
    topup.disabled = !data.tokenPack.checkoutAvailable;
    topup.title = data.tokenPack.checkoutAvailable ? "Buy extra tokens" : "Billing will be available once Paystack is configured";
    plansNode.replaceChildren();
    data.plans.forEach((plan) => {
      const card = document.createElement("article");
      card.className = `ai-plan-card${data.plan === plan.id ? " is-current" : ""}`;
      const title = document.createElement("h3"); title.textContent = plan.name;
      const price = document.createElement("strong"); price.textContent = formatPrice(plan.priceKobo) + (plan.priceKobo ? " / month" : "");
      const allowance = document.createElement("p"); allowance.textContent = `${formatNumber(plan.monthlyTokens)} tokens per month`;
      const keys = document.createElement("p"); keys.textContent = plan.maxActiveKeys ? `${plan.maxActiveKeys} keys · expire after ${plan.keyLifetimeDays} days · ${formatNumber(plan.keyTokenLimit)} tokens per key` : "No API keys";
      const button = document.createElement("button"); button.type = "button";
      button.textContent = data.plan === plan.id ? "Current plan" : plan.checkoutAvailable ? `Choose ${plan.name}` : "Checkout unavailable";
      button.disabled = data.plan === plan.id || !plan.checkoutAvailable;
      button.addEventListener("click", async () => {
        try { const result = await request("/checkout", { method: "POST", body: JSON.stringify({ planId: plan.id }) }); location.assign(result.authorizationUrl); }
        catch (error) { showStatus(error.message, true); }
      });
      card.append(title, price, allowance, keys, button); plansNode.append(card);
    });
    keyList.replaceChildren();
    if (!data.keys.length) { const empty = document.createElement("p"); empty.textContent = "No active API keys. Pro and Business plans include short-lived keys."; keyList.append(empty); }
    data.keys.forEach((key) => {
      const row = document.createElement("div"); row.className = "api-key-row";
      const details = document.createElement("span"); details.textContent = `${key.name} · ${key.prefix}… · ${formatNumber(key.tokensUsed)} / ${formatNumber(key.tokenLimit)} tokens · expires ${new Date(key.expiresAt).toLocaleDateString()}`;
      const revoke = document.createElement("button"); revoke.type = "button"; revoke.textContent = "Revoke";
      revoke.addEventListener("click", async () => { try { await request(`/keys/${key._id}`, { method: "DELETE" }); showStatus("API key revoked."); await load(); } catch (error) { showStatus(error.message, true); } });
      row.append(details, revoke); keyList.append(row);
    });
    const currentPlan = data.plans.find((plan) => plan.id === data.plan);
    const createButton = integrationRoot.querySelector("#apiKeyCreateForm button");
    if (createButton) {
      const atLimit = data.keys.length >= (currentPlan?.maxActiveKeys || 0);
      createButton.disabled = atLimit;
      createButton.title = atLimit ? (currentPlan?.maxActiveKeys ? "All active key slots are in use" : "API keys require a Pro or Business plan") : "Generate a key that expires automatically";
      if (!currentPlan?.maxActiveKeys) createButton.textContent = "Upgrade to Pro to generate keys";
      else createButton.textContent = atLimit ? "API key limit reached" : "Generate short-lived key";
    }
  }

  async function load() {
    if (!token) { showStatus("Sign in to manage your plan, tokens, and API keys.", true); plansNode.textContent = "Sign in to view AI plans."; return; }
    try { render(await request("/overview")); }
    catch (error) { showStatus(error.message, true); }
  }

  window.addEventListener("ai-usage-updated", load);

  document.getElementById("apiKeyCreateForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const name = document.getElementById("apiKeyName").value.trim();
      const result = await request("/keys", { method: "POST", body: JSON.stringify({ name }) });
      secretNotice.replaceChildren(); secretNotice.hidden = false;
      const label = document.createElement("strong"); label.textContent = "Copy this API key now. It cannot be shown again: ";
      const code = document.createElement("code"); code.textContent = result.key;
      const copy = document.createElement("button"); copy.type = "button"; copy.textContent = "Copy key"; copy.addEventListener("click", async () => { await navigator.clipboard.writeText(result.key); showStatus("API key copied."); });
      secretNotice.append(label, code, copy); showStatus("API key created. Store it securely."); event.target.reset(); await load();
    } catch (error) { showStatus(error.message, true); }
  });

  document.getElementById("aiTopupButton").addEventListener("click", async () => {
    try { const result = await request("/topup", { method: "POST", body: "{}" }); location.assign(result.authorizationUrl); }
    catch (error) { showStatus(error.message, true); }
  });

  load();
});
