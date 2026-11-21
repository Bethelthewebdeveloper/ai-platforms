document.addEventListener("DOMContentLoaded", () => {
  const api = window.BusinessGrowthCustomers;
  const form = document.getElementById("customerForm");
  const submitButton = document.getElementById("addCustomerBtn");
  const message = document.getElementById("formMessage") || (() => {
    const element = document.createElement("p"); element.id = "formMessage"; element.setAttribute("role", "status"); element.setAttribute("aria-live", "polite"); form?.prepend(element); return element;
  })();
  if (!api || !form || !submitButton) return;

  const field = (id) => document.getElementById(id);
  const showMessage = (text, type = "error") => { message.textContent = text; message.className = `form-message ${type}`; message.style.display = "block"; };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const firstName = field("firstName").value.trim();
    const lastName = field("lastName").value.trim();
    const email = field("email").value.trim().toLowerCase();
    const phone = field("phone").value.trim();
    const customerType = field("customerType").value;
    if (!firstName || !lastName || !email || !customerType) return showMessage("First name, last name, email, and customer type are required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMessage("Please enter a valid email address.");
    if (phone && !/^[+()\d\s.-]{7,25}$/.test(phone)) return showMessage("Please enter a valid phone number.");

    submitButton.disabled = true;
    submitButton.textContent = "Saving customer…";
    message.style.display = "none";
    try {
      await api.migrateLegacy();
      await api.create({
        firstName,
        lastName,
        email,
        phone,
        company: field("company").value.trim(),
        customerType,
        industry: field("industry").value,
        location: field("location").value.trim(),
        status: "Active",
      });
      showMessage("Customer saved to your account. Returning to the customer list…", "success");
      window.setTimeout(() => { window.location.href = "customer.html"; }, 700);
    } catch (error) {
      showMessage(error.message || "Could not save this customer. Please try again.");
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="bi bi-person-plus-fill"></i> Add Customer';
    }
  });
});
