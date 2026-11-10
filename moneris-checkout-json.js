const form = document.querySelector("#checkout-form");
const jsonOutput = document.querySelector("#json-output");
const endpointOutput = document.querySelector("#endpoint");
const formMessage = document.querySelector("#form-message");
const copyMessage = document.querySelector("#copy-message");
const copyButton = document.querySelector("#copy-button");
const resetButton = document.querySelector("#reset-button");
const toggleTokenButton = document.querySelector("#toggle-token");
const apiTokenInput = document.querySelector("#api-token");

const cartItems = document.querySelector("#cart-items");
const tokenItems = document.querySelector("#token-items");
const cartTemplate = document.querySelector("#cart-item-template");
const tokenTemplate = document.querySelector("#token-item-template");
const addCartButton = document.querySelector("#add-cart-item");
const addTokenButton = document.querySelector("#add-token-item");

const endpoints = {
  qa: "https://gatewayt.moneris.com/chktv2/request/request.php"
};

const optionalFields = [
  "order_no",
  "cust_id",
  "dynamic_descriptor",
  "language",
  "data_key_format",
  "data_key",
  "ask_cvv"
];

function getValue(name) {
  const field = form.elements[name];
  return field ? field.value.trim() : "";
}

function readSection(id) {
  const section = document.querySelector(id);
  const object = {};

  section.querySelectorAll("[data-field]").forEach(field => {
    const value = field.value.trim();
    if (value) object[field.dataset.field] = value;
  });

  return object;
}

function hasValues(object) {
  return Object.keys(object).length > 0;
}

function readRepeatRow(row) {
  const object = {};

  row.querySelectorAll("[data-field]").forEach(field => {
    const value = field.value.trim();
    if (value) object[field.dataset.field] = value;
  });

  return object;
}

function buildCart() {
  const items = [...cartItems.querySelectorAll(".cart-item")]
    .map(readRepeatRow)
    .filter(hasValues);

  const cart = readSection("#cart-section");
  const tax = readSection("#tax-section");

  if (items.length) cart.items = items;
  if (hasValues(tax)) cart.tax = tax;

  return cart;
}

function buildTokens() {
  return [...tokenItems.querySelectorAll(".token-item")]
    .map(readRepeatRow)
    .filter(hasValues);
}

function buildRequest() {
  const request = {
    store_id: getValue("store_id"),
    api_token: getValue("api_token"),
    checkout_id: getValue("checkout_id"),
    txn_total: getValue("txn_total"),
    environment: getValue("environment"),
    action: "preload"
  };

  optionalFields.forEach(name => {
    const value = getValue(name);
    if (value) request[name] = value;
  });

  const contact = readSection("#contact-section");
  const shipping = readSection("#shipping-section");
  const billing = readSection("#billing-section");
  const recur = readSection("#recur-section");
  const cart = buildCart();
  const tokens = buildTokens();

  if (hasValues(recur)) request.recur = recur;
  if (hasValues(cart)) request.cart = cart;
  if (hasValues(contact)) request.contact_details = contact;
  if (hasValues(shipping)) request.shipping_details = shipping;
  if (hasValues(billing)) request.billing_details = billing;
  if (tokens.length) request.token = tokens;

  return request;
}

function missingFields(object, fields) {
  return fields.filter(field => !object[field]);
}

function validateObject(label, object, requiredFields) {
  if (!hasValues(object)) return "";

  const missing = missingFields(object, requiredFields);
  return missing.length
    ? `${label} is incomplete. Missing: ${missing.join(", ")}.`
    : "";
}

function validateRequest(request) {
  const missing = [];

  if (!request.store_id) missing.push("Store ID");
  if (!request.api_token) missing.push("API Token");
  if (!request.checkout_id) missing.push("Checkout ID");
  if (!request.txn_total) missing.push("Transaction Total");

  if (missing.length) {
    return `Missing required fields: ${missing.join(", ")}.`;
  }

  if (!/^\d+(\.\d{2})$/.test(request.txn_total)) {
    return "Transaction Total should use two decimal places, for example 100.00.";
  }

  const objectChecks = [
    validateObject("Contact details", request.contact_details || {}, ["first_name", "last_name", "email", "phone"]),
    validateObject("Shipping details", request.shipping_details || {}, ["address_1", "city", "province", "country", "postal_code"]),
    validateObject("Billing details", request.billing_details || {}, ["address_1", "city", "province", "country", "postal_code"]),
    validateObject("Recurring billing", request.recur || {}, ["bill_now", "recur_amount", "start_date", "recur_unit", "recur_period", "number_of_recurs"])
  ].filter(Boolean);

  if (objectChecks.length) return objectChecks[0];

  if (request.recur && !/^\d+(\.\d{2})$/.test(request.recur.recur_amount)) {
    return "Recurring Amount should use two decimal places, for example 25.00.";
  }

  if (request.cart) {
    if (request.cart.items) {
      for (let index = 0; index < request.cart.items.length; index += 1) {
        const item = request.cart.items[index];
        const itemMissing = missingFields(item, ["url", "description", "product_code", "unit_cost", "quantity"]);
        if (itemMissing.length) {
          return `Cart item ${index + 1} is incomplete. Missing: ${itemMissing.join(", ")}.`;
        }

        if (!/^\d+(\.\d{2})$/.test(item.unit_cost)) {
          return `Cart item ${index + 1} Unit Cost should use two decimal places.`;
        }
      }

      if (!request.cart.subtotal) {
        return "Cart Subtotal is required when cart items are included.";
      }
    }

    if (request.cart.subtotal && !/^\d+(\.\d{2})$/.test(request.cart.subtotal)) {
      return "Cart Subtotal should use two decimal places.";
    }

    if (request.cart.tax) {
      const taxMissing = missingFields(request.cart.tax, ["amount", "description", "rate"]);
      if (taxMissing.length) {
        return `Tax details are incomplete. Missing: ${taxMissing.join(", ")}.`;
      }

      if (!/^\d+(\.\d{2})$/.test(request.cart.tax.amount)) {
        return "Tax Amount should use two decimal places.";
      }
    }
  }

  if (request.token) {
    for (let index = 0; index < request.token.length; index += 1) {
      const tokenMissing = missingFields(request.token[index], ["data_key", "issuer_id"]);
      if (tokenMissing.length) {
        return `Token ${index + 1} is incomplete. Missing: ${tokenMissing.join(", ")}.`;
      }
    }
  }

  if (request.ask_cvv && !request.token) {
    return "Ask CVV is only applicable when a token array is included.";
  }

  return "";
}

function updateRowTitles(container, selector, label) {
  container.querySelectorAll(selector).forEach((row, index) => {
    row.querySelector(".row-title").textContent = `${label} ${index + 1}`;
    row.querySelector(".remove-row").hidden = container.querySelectorAll(selector).length === 1;
  });
}

function addRepeatRow(template, container, selector, label) {
  const fragment = template.content.cloneNode(true);
  const row = fragment.querySelector(selector);

  row.querySelector(".remove-row").addEventListener("click", () => {
    row.remove();
    updateRowTitles(container, selector, label);
    renderRequest();
  });

  container.appendChild(fragment);
  updateRowTitles(container, selector, label);
}

function addCartItem() {
  addRepeatRow(cartTemplate, cartItems, ".cart-item", "Item");
  renderRequest();
}

function addTokenItem() {
  if (tokenItems.querySelectorAll(".token-item").length >= 3) {
    formMessage.textContent = "Moneris Checkout supports a maximum of three token entries.";
    return;
  }

  addRepeatRow(tokenTemplate, tokenItems, ".token-item", "Token");
  renderRequest();
}

function resetRepeatRows() {
  cartItems.innerHTML = "";
  tokenItems.innerHTML = "";
  addRepeatRow(cartTemplate, cartItems, ".cart-item", "Item");
  addRepeatRow(tokenTemplate, tokenItems, ".token-item", "Token");
}

function renderRequest() {
  const request = buildRequest();
  endpointOutput.textContent = endpoints[request.environment];
  jsonOutput.textContent = JSON.stringify(request, null, 2);
  formMessage.textContent = validateRequest(request);
  copyMessage.textContent = "";
}

form.addEventListener("input", renderRequest);
form.addEventListener("change", renderRequest);
addCartButton.addEventListener("click", addCartItem);
addTokenButton.addEventListener("click", addTokenItem);

copyButton.addEventListener("click", async () => {
  const request = buildRequest();
  const validationMessage = validateRequest(request);

  if (validationMessage) {
    formMessage.textContent = validationMessage;
    return;
  }

  try {
    await navigator.clipboard.writeText(JSON.stringify(request, null, 2));
    copyMessage.textContent = "JSON copied to clipboard.";
  } catch {
    copyMessage.textContent = "Clipboard access failed. Select and copy the JSON manually.";
  }
});

resetButton.addEventListener("click", () => {
  form.reset();
  apiTokenInput.type = "password";
  toggleTokenButton.textContent = "Show";
  resetRepeatRows();
  renderRequest();
});

toggleTokenButton.addEventListener("click", () => {
  const hidden = apiTokenInput.type === "password";
  apiTokenInput.type = hidden ? "text" : "password";
  toggleTokenButton.textContent = hidden ? "Hide" : "Show";
});

resetRepeatRows();
renderRequest();
