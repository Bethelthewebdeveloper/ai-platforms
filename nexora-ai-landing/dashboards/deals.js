document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("dealList");
  const form = document.getElementById("dealForm");
  if (!list || !form) return;

  const API_URL = `${window.BusinessGrowthAPI.core}/deals`;
  const $ = (id) => document.getElementById(id);
  const dialog = $("dealDialog");
  const status = $("dealsStatus");
  const filters = document.querySelectorAll("[data-deal-filter]");
  const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 });
  let deals = [];
  let activeFilter = "all";

  async function request(path = "", options = {}) {
    const token = sessionStorage.getItem("businessGrowthToken");
    if (!token) throw new Error("Please sign in again to manage your deals.");
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || "Could not complete the deal request.");
    return body;
  }

  const stageNames = { lead: "Lead", qualified: "Qualified", proposal: "Proposal", negotiation: "Negotiation", won: "Won", lost: "Lost" };
  const dateText = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "No close date";

  function render() {
    const query = ($("dealSearch")?.value || "").trim().toLowerCase();
    const open = deals.filter((deal) => !["won", "lost"].includes(deal.stage));
    $("dealOpenCount").textContent = String(open.length);
    $("dealPipelineValue").textContent = money.format(open.reduce((sum, deal) => sum + (deal.amountKobo || 0), 0) / 100);
    $("dealWonCount").textContent = String(deals.filter((deal) => deal.stage === "won").length);
    const activeDeals = $("activeDeals");
    if (activeDeals) activeDeals.textContent = String(open.length);

    const visible = deals.filter((deal) => {
      const filterMatch = activeFilter === "all" || (activeFilter === "open" ? !["won", "lost"].includes(deal.stage) : deal.stage === activeFilter);
      const queryMatch = !query || `${deal.name} ${deal.customer} ${deal.notes}`.toLowerCase().includes(query);
      return filterMatch && queryMatch;
    });
    list.replaceChildren();
    if (!visible.length) {
      const empty = document.createElement("div");
      empty.className = "deal-empty-state";
      empty.innerHTML = `<i class="bi bi-inboxes" aria-hidden="true"></i><strong>${deals.length ? "No deals match this view" : "No deals yet"}</strong><span>${deals.length ? "Try another filter or search." : "Add an opportunity to start building your pipeline."}</span>`;
      list.append(empty);
      return;
    }

    visible.forEach((deal) => {
      const card = document.createElement("article");
      card.className = `deal-card stage-${deal.stage}`;
      const top = document.createElement("div"); top.className = "deal-card-top";
      const title = document.createElement("div"); title.className = "deal-card-title";
      const heading = document.createElement("h3"); heading.textContent = deal.name;
      const customer = document.createElement("span"); customer.textContent = deal.customer || "No customer linked";
      title.append(heading, customer);
      const badge = document.createElement("span"); badge.className = `deal-stage-badge stage-badge-${deal.stage}`; badge.textContent = stageNames[deal.stage] || deal.stage;
      top.append(title, badge);
      const notes = document.createElement("p"); notes.className = "deal-notes"; notes.textContent = deal.notes || "No notes added.";
      const footer = document.createElement("div"); footer.className = "deal-card-footer";
      const detail = document.createElement("div"); detail.className = "deal-card-meta";
      const value = document.createElement("strong"); value.className = "deal-value"; value.textContent = money.format((deal.amountKobo || 0) / 100);
      const closeDate = document.createElement("span"); closeDate.className = "deal-close-date"; closeDate.textContent = `Expected close: ${dateText(deal.expectedCloseDate)}`;
      detail.append(value, closeDate);
      const actions = document.createElement("div"); actions.className = "deal-card-actions";
      const stageSelect = document.createElement("select"); stageSelect.className = "deal-stage-select"; stageSelect.setAttribute("aria-label", `Update stage for ${deal.name}`);
      Object.entries(stageNames).forEach(([stage, label]) => { const option = document.createElement("option"); option.value = stage; option.textContent = label; option.selected = deal.stage === stage; stageSelect.append(option); });
      stageSelect.addEventListener("change", async () => { try { await request(`/${deal._id}`, { method: "PATCH", body: JSON.stringify({ stage: stageSelect.value }) }); await loadDeals(); } catch (error) { status.textContent = error.message; stageSelect.value = deal.stage; } });
      const edit = document.createElement("button"); edit.type = "button"; edit.className = "deal-action-button"; edit.textContent = "Edit"; edit.addEventListener("click", () => openForm(deal));
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "deal-action-button deal-remove-button"; remove.textContent = "Delete"; remove.addEventListener("click", async () => { if (!window.confirm(`Delete “${deal.name}”?`)) return; try { await request(`/${deal._id}`, { method: "DELETE" }); await loadDeals(); } catch (error) { status.textContent = error.message; } });
      actions.append(stageSelect, edit, remove);
      footer.append(detail, actions);
      card.append(top, notes, footer);
      list.append(card);
    });
  }

  async function loadDeals() {
    status.textContent = "Loading deals…";
    try { const result = await request(); deals = result.deals || []; status.textContent = deals.length ? `${deals.length} ${deals.length === 1 ? "deal" : "deals"}` : "Your deals will appear here."; render(); window.dispatchEvent(new Event("businessgrowth:deals-updated")); }
    catch (error) { status.textContent = error.message; list.replaceChildren(); }
  }

  function openForm(deal) {
    form.reset(); $("dealFormError").textContent = "";
    $("dealId").value = deal?._id || "";
    $("dealName").value = deal?.name || "";
    $("dealCustomer").value = deal?.customer || "";
    $("dealAmount").value = deal ? (deal.amountKobo / 100).toFixed(2) : "";
    $("dealCloseDate").value = deal?.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().slice(0, 10) : "";
    $("dealStage").value = deal?.stage || "lead";
    $("dealNotes").value = deal?.notes || "";
    $("dealDialogHeading").textContent = deal ? "Edit deal" : "Create a deal";
    $("saveDealButton").textContent = deal ? "Save changes" : "Save deal";
    dialog.showModal();
    $("dealName").focus();
  }

  $("createDealButton")?.addEventListener("click", () => openForm());
  $("closeDealDialog")?.addEventListener("click", () => dialog.close());
  $("cancelDealDialog")?.addEventListener("click", () => dialog.close());
  $("dealSearch")?.addEventListener("input", render);
  filters.forEach((button) => button.addEventListener("click", () => { activeFilter = button.dataset.dealFilter; filters.forEach((item) => item.classList.toggle("active", item === button)); render(); }));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = $("dealId").value;
    const payload = {
      name: $("dealName").value.trim(), customer: $("dealCustomer").value.trim(),
      amountKobo: Math.round(Number($("dealAmount").value) * 100),
      expectedCloseDate: $("dealCloseDate").value || null,
      stage: $("dealStage").value, notes: $("dealNotes").value.trim(),
    };
    const button = $("saveDealButton"); button.disabled = true; $("dealFormError").textContent = "";
    try { await request(id ? `/${id}` : "", { method: id ? "PATCH" : "POST", body: JSON.stringify(payload) }); dialog.close(); await loadDeals(); }
    catch (error) { $("dealFormError").textContent = error.message; }
    finally { button.disabled = false; }
  });

  loadDeals();
});
