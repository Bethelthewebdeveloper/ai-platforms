document.addEventListener("DOMContentLoaded", () => {
  const api = window.BusinessGrowthCustomers;
  const body = document.getElementById("customerTableBody");
  const empty = document.getElementById("customerEmpty");
  const search = document.getElementById("customerSearch");
  const message = document.getElementById("customerPageMessage");
  if (!api || !body || !empty) return;

  let customers = [];
  let loading = false;
  const byId = (id) => document.getElementById(id);

  function setupHeaderControls() {
    const themeToggle = byId("themeToggle");
    const themeIcon = themeToggle?.querySelector("i");
    const applyTheme = (theme) => {
      const light = theme === "light";
      document.body.classList.toggle("light-mode", light);
      document.body.classList.toggle("dark-mode", !light);
      if (themeIcon) themeIcon.className = light ? "bi bi-moon-stars" : "bi bi-sun";
      themeToggle?.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
      themeToggle?.setAttribute("title", light ? "Switch to dark mode" : "Switch to light mode");
      try { localStorage.setItem("businessGrowthTheme", light ? "light" : "dark"); } catch { /* Keep the selected theme for this page. */ }
    };
    let savedTheme = "dark";
    try { savedTheme = localStorage.getItem("businessGrowthTheme") || "dark"; } catch { /* Use dark by default. */ }
    applyTheme(savedTheme);
    themeToggle?.addEventListener("click", () => applyTheme(document.body.classList.contains("light-mode") ? "dark" : "light"));

    const notifications = byId("notificationsPopover");
    const notificationButton = byId("notificationButton");
    const profile = byId("profilePopover");
    const avatar = byId("topbarAvatar");
    const closeMenus = () => {
      notifications.hidden = true; profile.hidden = true;
      notificationButton?.setAttribute("aria-expanded", "false");
      avatar?.setAttribute("aria-expanded", "false");
    };
    notificationButton?.addEventListener("click", (event) => {
      event.stopPropagation(); const shouldOpen = notifications.hidden; closeMenus(); notifications.hidden = !shouldOpen;
      notificationButton.setAttribute("aria-expanded", String(shouldOpen));
    });
    avatar?.addEventListener("click", (event) => {
      event.stopPropagation(); const shouldOpen = profile.hidden; closeMenus(); profile.hidden = !shouldOpen;
      avatar.setAttribute("aria-expanded", String(shouldOpen));
    });
    [notifications, profile].forEach((menu) => menu?.addEventListener("click", (event) => event.stopPropagation()));
    document.addEventListener("click", closeMenus);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenus(); });

    try {
      const user = JSON.parse(sessionStorage.getItem("businessGrowthUser") || "{}");
      const first = String(user.firstName || "").trim();
      const last = String(user.lastName || "").trim();
      const name = `${first} ${last}`.trim() || user.username || "Your account";
      const initials = `${first.charAt(0)}${last.charAt(0)}`.trim().toUpperCase() || name.slice(0, 2).toUpperCase();
      byId("topbarUserName").textContent = name;
      byId("topbarUserEmail").textContent = user.email || "";
      avatar.textContent = initials;
      byId("sidebarUserName").textContent = name;
      byId("sidebarUserRole").textContent = user.accountType === "business" ? "Business Owner" : user.accountType || "Account Owner";
      byId("sidebarAvatar").textContent = initials;
    } catch { /* Keep the fallback initials and name. */ }
    byId("signOutLink")?.addEventListener("click", () => {
      sessionStorage.removeItem("businessGrowthToken");
      sessionStorage.removeItem("businessGrowthUser");
    });
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
  }

  function setStats() {
    const now = new Date();
    const thisMonth = customers.filter((customer) => {
      const date = new Date(customer.createdAt);
      return !Number.isNaN(date.getTime()) && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    const active = customers.filter((customer) => String(customer.status || "Active").toLowerCase() === "active").length;
    const returning = customers.filter((customer) => Number(customer.purchaseCount || customer.totalPurchases || customer.purchases?.length || 0) > 1).length;
    byId("totalCustomers").textContent = String(customers.length);
    byId("newCustomers").textContent = String(thisMonth);
    byId("activeCustomers").textContent = String(active);
    byId("returningCustomers").textContent = String(returning);
  }

  function render() {
    setStats();
    const query = (search?.value || "").trim().toLowerCase();
    const visible = customers.filter((customer) => {
      const name = `${customer.firstName || ""} ${customer.lastName || ""}`;
      return `${name} ${customer.company || ""} ${customer.email || ""} ${customer.phone || ""}`.toLowerCase().includes(query);
    });
    body.replaceChildren();
    empty.hidden = visible.length > 0;
    if (!visible.length) {
      empty.innerHTML = customers.length
        ? "<strong>No customers match your search</strong>Try another name, company, or email."
        : '<strong>No customers yet</strong>Add your first customer to start building your customer list.';
      return;
    }

    visible.forEach((customer) => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      const name = document.createElement("div"); name.className = "customer-primary";
      const fullName = document.createElement("strong"); fullName.textContent = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Unnamed customer";
      const email = document.createElement("span"); email.textContent = customer.email || "No email";
      name.append(fullName, email); nameCell.append(name); row.append(nameCell);
      [customer.company || "—", customer.phone || "—", customer.customerType || "—"].forEach((value) => { const cell = document.createElement("td"); cell.textContent = value; row.append(cell); });
      const statusCell = document.createElement("td");
      const status = document.createElement("span"); status.className = `customer-status${String(customer.status || "Active").toLowerCase() === "active" ? "" : " inactive"}`; status.textContent = customer.status || "Active"; statusCell.append(status); row.append(statusCell);
      const dateCell = document.createElement("td"); dateCell.textContent = formatDate(customer.createdAt); row.append(dateCell);
      const actionCell = document.createElement("td");
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "customer-delete"; remove.setAttribute("aria-label", `Delete ${fullName.textContent}`); remove.title = "Delete customer"; remove.innerHTML = '<i class="bi bi-trash3" aria-hidden="true"></i>';
      remove.addEventListener("click", async () => {
        if (!window.confirm(`Delete ${fullName.textContent} from your customer list?`)) return;
        remove.disabled = true;
        try { await api.remove(customer._id); await loadCustomers(); }
        catch (error) { if (message) message.textContent = error.message; remove.disabled = false; }
      });
      actionCell.append(remove); row.append(actionCell); body.append(row);
    });
  }

  async function loadCustomers() {
    if (loading) return;
    loading = true;
    if (message) message.textContent = "Loading customers…";
    try {
      await api.migrateLegacy();
      customers = await api.list();
      if (message) message.textContent = "";
      render();
    } catch (error) {
      customers = [];
      setStats();
      body.replaceChildren();
      empty.hidden = false;
      empty.textContent = error.message || "Could not load your customers.";
      if (message) message.textContent = "Make sure you are signed in and the BusinessGrowth server is available.";
    } finally { loading = false; }
  }

  function exportCsv() {
    const rows = [["First name", "Last name", "Email", "Phone", "Company", "Type", "Industry", "Location", "Status", "Added"]];
    customers.forEach((customer) => rows.push([customer.firstName, customer.lastName, customer.email, customer.phone, customer.company, customer.customerType, customer.industry, customer.location, customer.status, customer.createdAt]));
    const csv = rows.map((row) => row.map((value) => `"${String(value || "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "businessgrowth-customers.csv"; link.click(); URL.revokeObjectURL(url);
  }

  search?.addEventListener("input", render);
  byId("exportCustomersButton")?.addEventListener("click", exportCsv);
  window.addEventListener("businessgrowth:customers-updated", loadCustomers);
  setupHeaderControls();
  loadCustomers();
});
