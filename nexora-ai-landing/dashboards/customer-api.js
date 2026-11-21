(() => {
  const endpoint = `${window.BusinessGrowthAPI.core}/customers`;
  const legacyKey = "businessGrowthCustomers";
  let migrationInProgress = null;

  async function request(path = "", options = {}) {
    const token = sessionStorage.getItem("businessGrowthToken");
    if (!token) throw new Error("Please sign in again to manage your customers.");
    const response = await fetch(`${endpoint}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.message || "Could not complete the customer request.");
      error.status = response.status;
      throw error;
    }
    return body;
  }

  async function list() {
    const result = await request();
    return result.customers || [];
  }

  async function create(customer, notify = true) {
    const result = await request("", { method: "POST", body: JSON.stringify(customer) });
    if (notify) window.dispatchEvent(new Event("businessgrowth:customers-updated"));
    return result.customer;
  }

  async function update(id, customer) {
    const result = await request(`/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(customer) });
    window.dispatchEvent(new Event("businessgrowth:customers-updated"));
    return result.customer;
  }

  async function remove(id) {
    await request(`/${encodeURIComponent(id)}`, { method: "DELETE" });
    window.dispatchEvent(new Event("businessgrowth:customers-updated"));
  }

  function migrateLegacy() {
    if (migrationInProgress) return migrationInProgress;
    migrationInProgress = migrateLegacyRecords().finally(() => { migrationInProgress = null; });
    return migrationInProgress;
  }

  async function migrateLegacyRecords() {
    const raw = localStorage.getItem(legacyKey);
    if (!raw) return;
    let legacy;
    try { legacy = JSON.parse(raw); } catch { throw new Error("Your saved customer list could not be read. It has been left in this browser unchanged."); }
    if (!Array.isArray(legacy)) throw new Error("Your saved customer list is not valid. It has been left in this browser unchanged.");
    if (!legacy.length) { localStorage.removeItem(legacyKey); return; }

    const current = await list();
    const existingEmails = new Set(current.map((customer) => String(customer.email || "").toLowerCase()));
    for (const old of legacy) {
      const customer = {
        firstName: String(old.firstName || "").trim(),
        lastName: String(old.lastName || "").trim(),
        email: String(old.email || "").trim().toLowerCase(),
        phone: String(old.phone || "").trim(),
        company: String(old.company || "").trim(),
        customerType: old.customerType,
        industry: String(old.industry || "").trim(),
        location: String(old.location || "").trim(),
        status: old.status === "Inactive" ? "Inactive" : "Active",
        ...(old.createdAt && !Number.isNaN(new Date(old.createdAt).getTime()) ? { createdAt: old.createdAt } : {}),
      };
      if (customer.email && existingEmails.has(customer.email)) continue;
      try {
        await create(customer, false);
        existingEmails.add(customer.email);
      } catch (error) {
        if (error.status !== 409) throw new Error(`Could not import the saved customer “${customer.firstName} ${customer.lastName}”: ${error.message}. The browser copy has been kept.`);
        existingEmails.add(customer.email);
      }
    }
    localStorage.removeItem(legacyKey);
    window.dispatchEvent(new Event("businessgrowth:customers-updated"));
  }

  window.BusinessGrowthCustomers = { list, create, update, remove, migrateLegacy };
})();
