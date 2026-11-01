"use strict";

document.addEventListener("DOMContentLoaded", function () {
// =========================================
// BUSINESSGROWTH ADD CUSTOMER
// =========================================

const customerForm = document.getElementById("customerForm");
const addCustomerBtn = document.getElementById("addCustomerBtn");

const STORAGE_KEY = "businessGrowthCustomers";

if (!customerForm || !addCustomerBtn) {
console.error("Customer form or Add Customer button was not found.");
return;
}

// Connect the button to the form because it is outside the form.
addCustomerBtn.addEventListener("click", function (event) {
event.preventDefault();
customerForm.requestSubmit();
});

// =========================================
// FORM FIELDS
// =========================================

const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const company = document.getElementById("company");
const customerType = document.getElementById("customerType");
const industry = document.getElementById("industry");
const location = document.getElementById("location");

// =========================================
// GET SAVED CUSTOMERS
// =========================================

function getCustomers() {
try {
const savedCustomers = localStorage.getItem(STORAGE_KEY);

  if (!savedCustomers) {
    return [];
  }

  const customers = JSON.parse(savedCustomers);

  if (!Array.isArray(customers)) {
    console.error("Saved customer data is not a valid list.");
    return null;
  }

  return customers;
} catch (error) {
  console.error("Unable to load customers:", error);
  return null;
}

}

// =========================================
// FORM MESSAGE
// =========================================

let formMessage = document.getElementById("formMessage");

if (!formMessage) {
formMessage = document.createElement("p");
formMessage.id = "formMessage";
formMessage.setAttribute("role", "status");
formMessage.setAttribute("aria-live", "polite");
customerForm.prepend(formMessage);
}

function showMessage(message, type) {
formMessage.textContent = message;
formMessage.className = "form-message " + type;
formMessage.style.display = "block";
}

function clearMessage() {
formMessage.textContent = "";
formMessage.className = "form-message";
formMessage.style.display = "none";
}

// =========================================
// VALIDATION
// =========================================

function validateForm() {
clearMessage();

const requiredFields = [
  { field: firstName, label: "First name" },
  { field: lastName, label: "Last name" },
  { field: email, label: "Email address" },
  { field: customerType, label: "Customer type" }
];

for (const item of requiredFields) {
  if (!item.field || !item.field.value.trim()) {
    showMessage(item.label + " is required.", "error");

    if (item.field) {
      item.field.focus();
    }

    return false;
  }
}

const emailValue = email.value.trim();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailPattern.test(emailValue)) {
  showMessage("Please enter a valid email address.", "error");
  email.focus();
  return false;
}

if (
  phone.value.trim() &&
  !/^[+()\d\s.-]{7,25}$/.test(phone.value.trim())
) {
  showMessage("Please enter a valid phone number.", "error");
  phone.focus();
  return false;
}

return true;

}

// =========================================
// CREATE CUSTOMER OBJECT
// =========================================

function createCustomer() {
return {
id:
typeof crypto !== "undefined" &&
typeof crypto.randomUUID === "function"
? crypto.randomUUID()
: Date.now().toString(),

  firstName: firstName.value.trim(),
  lastName: lastName.value.trim(),
  email: email.value.trim().toLowerCase(),
  phone: phone.value.trim(),

  company: company.value.trim(),

  customerType: customerType.value,

  industry: industry.value,

  location: location.value.trim(),

  status: "Active",

  createdAt: new Date().toISOString()
};

}

// =========================================
// SAVE CUSTOMER
// =========================================

customerForm.addEventListener("submit", function (event) {
event.preventDefault();

if (!validateForm()) {
  return;
}

const customers = getCustomers();

if (customers === null) {
  showMessage(
    "Unable to access saved customers. Please check your browser storage.",
    "error"
  );
  return;
}

const customer = createCustomer();

// Prevent duplicate email addresses.
const duplicateEmail = customers.some(function (savedCustomer) {
  return (
    savedCustomer.email &&
    savedCustomer.email.toLowerCase() === customer.email
  );
});

if (duplicateEmail) {
  showMessage(
    "A customer with this email address already exists.",
    "error"
  );

  email.focus();
  return;
}

// Save the new customer.
customers.push(customer);

try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
} catch (error) {
  console.error("Unable to save customer:", error);

  showMessage(
    "Customer could not be saved. Please check your browser storage.",
    "error"
  );

  return;
}

showMessage(
  "Customer added successfully! Returning to Customers...",
  "success"
);

addCustomerBtn.disabled = true;

// =========================================
// PROFESSIONAL NOTIFICATIONS
// =========================================

let messageTimer;

function showMessage(message, type) {
clearTimeout(messageTimer);

formMessage.textContent = message;
formMessage.className = "";
formMessage.classList.add(type);

formMessage.style.display = "block";

// Restart the entrance animation.
formMessage.style.animation = "none";
void formMessage.offsetWidth;
formMessage.style.animation = "";

// Automatically hide error messages after 5 seconds.
// Keep the success message visible while redirecting.
if (type === "error") {
messageTimer = setTimeout(function () {
formMessage.style.display = "none";
}, 5000);
}
}

function clearMessage() {
clearTimeout(messageTimer);

formMessage.textContent = "";
formMessage.className = "";
formMessage.style.display = "none";
}

// Return to the Customers page after saving.
setTimeout(function () {
  window.location.href = "customers.html";
}, 1000);

});
});