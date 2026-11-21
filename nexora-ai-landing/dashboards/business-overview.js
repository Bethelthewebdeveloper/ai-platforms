document.addEventListener("DOMContentLoaded", () => {
  const overview = document.querySelector(".business-overview");
  if (!overview) return;

  const API_ROOT = window.BusinessGrowthAPI.core;
  const token = sessionStorage.getItem("businessGrowthToken");
  const $ = (id) => document.getElementById(id);
  const updated = $("overviewUpdated");
  const errorMessage = $("overviewError");

  async function fetchList(endpoint, key) {
    const response = await fetch(`${API_ROOT}/${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || `Unable to load ${endpoint}.`);
    return Array.isArray(body[key]) ? body[key] : [];
  }

  async function refresh() {
    if (!token) {
      errorMessage.textContent = "Sign in to load your business totals.";
      return;
    }
    updated.textContent = "Updating…";
    const [customersResult, dealsResult, tasksResult] = await Promise.allSettled([
      (async () => { await window.BusinessGrowthCustomers.migrateLegacy(); return window.BusinessGrowthCustomers.list(); })(),
      fetchList("deals", "deals"),
      fetchList("tasks", "tasks"),
    ]);

    if (customersResult.status === "fulfilled") {
      const count = customersResult.value.length;
      $("overviewCustomers").textContent = String(count);
      $("overviewCustomersNote").textContent = count === 1 ? "1 saved customer" : `${count} saved customers`;
    }
    if (dealsResult.status === "fulfilled") {
      const deals = dealsResult.value;
      const openDeals = deals.filter((deal) => !["won", "lost"].includes(deal.stage));
      $("overviewOpenDeals").textContent = String(openDeals.length);
      const pipelineKobo = openDeals.reduce((sum, deal) => sum + (Number(deal.amountKobo) || 0), 0);
      $("overviewPipelineNote").textContent = `${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(pipelineKobo / 100)} in open pipeline`;
    }
    if (tasksResult.status === "fulfilled") {
      const tasks = tasksResult.value;
      const completed = tasks.filter((task) => task.status === "done").length;
      $("overviewTasksCompleted").textContent = String(completed);
      $("overviewTasksNote").textContent = `${completed} of ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} completed`;
    }

    const failed = [customersResult, dealsResult, tasksResult].some((result) => result.status === "rejected");
    errorMessage.textContent = failed ? "Some totals could not load. Check that the server is running, then refresh." : "";
    updated.textContent = `Updated ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date())}`;
  }

  window.addEventListener("businessgrowth:customers-updated", refresh);
  window.addEventListener("businessgrowth:deals-updated", refresh);
  window.addEventListener("businessgrowth:tasks-updated", refresh);
  refresh();
});
