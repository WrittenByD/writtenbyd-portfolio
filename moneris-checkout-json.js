const form = document.querySelector("#checkout-form");
const jsonOutput = document.querySelector("#json-output");
const endpointOutput = document.querySelector("#endpoint");
const formMessage = document.querySelector("#form-message");
const copyMessage = document.querySelector("#copy-message");
const copyButton = document.querySelector("#copy-button");
const resetButton = document.querySelector("#reset-button");
const toggleTokenButton = document.querySelector("#toggle-token");
const apiTokenInput = document.querySelector("#api-token");

const endpoints = {
  qa: "https://gatewayt.moneris.com/chktv2/request/request.php",
  prod: "https://gateway.moneris.com/chktv2/request/request.php"
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

  return request;
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

  return "";
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
  renderRequest();
});

toggleTokenButton.addEventListener("click", () => {
  const hidden = apiTokenInput.type === "password";
  apiTokenInput.type = hidden ? "text" : "password";
  toggleTokenButton.textContent = hidden ? "Hide" : "Show";
});

renderRequest();
