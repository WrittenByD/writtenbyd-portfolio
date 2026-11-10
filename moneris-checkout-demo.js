const API_BASE = "YOUR_WORKER_URL";

const amountForm = document.querySelector("#amount-form");
const amountInput = document.querySelector("#amount");
const startButton = document.querySelector("#start-checkout");
const closeButton = document.querySelector("#close-checkout");
const checkoutShell = document.querySelector("#checkout-shell");
const resultCard = document.querySelector("#result-card");
const receiptOutput = document.querySelector("#receipt-output");
const resultTitle = document.querySelector("#result-title");
const statusTitle = document.querySelector("#status-title");
const statusMessage = document.querySelector("#status-message");
const callbackLog = document.querySelector("#callback-log");

let checkout = null;
let currentTicket = "";
let events = [];

function setStatus(title, message) {
  statusTitle.textContent = title;
  statusMessage.textContent = message;
}

function addEvent(name, payload) {
  events.unshift({
    time: new Date().toLocaleTimeString(),
    event: name,
    payload
  });

  callbackLog.textContent = JSON.stringify(events, null, 2);
}

function parseCallback(payload) {
  try {
    return typeof payload === "string" ? JSON.parse(payload) : payload;
  } catch {
    return { raw: payload };
  }
}

function validAmount(value) {
  return /^\d+(\.\d{2})$/.test(value) && Number(value) > 0;
}

async function callBackend(path, body) {
  if (API_BASE === "YOUR_WORKER_URL") {
    throw new Error("Backend URL has not been configured yet.");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Backend request failed.");
  }

  return data;
}

function setupCheckout() {
  if (checkout) return;

  checkout = new monerisCheckout();
  checkout.setMode("qa");
  checkout.setCheckoutDiv("monerisCheckout");

  checkout.setCallback("page_loaded", payload => {
    const data = parseCallback(payload);
    addEvent("page_loaded", data);
    setStatus("Checkout loaded", "Moneris Checkout is ready for test payment details.");
  });

  checkout.setCallback("payment_submitted", payload => {
    const data = parseCallback(payload);
    addEvent("payment_submitted", data);
    setStatus("Processing", "The test payment has been submitted.");
  });

  checkout.setCallback("payment_receipt", payload => {
    addEvent("payment_receipt", parseCallback(payload));
  });

  checkout.setCallback("cancel_transaction", payload => {
    addEvent("cancel_transaction", parseCallback(payload));
    setStatus("Cancelled", "The checkout was cancelled.");
    checkout.closeCheckout();
    checkoutShell.hidden = true;
  });

  checkout.setCallback("error_event", payload => {
    const data = parseCallback(payload);
    addEvent("error_event", data);
    setStatus("Checkout error", "Moneris returned an error event. See the callback log.");
  });

  checkout.setCallback("page_closed", payload => {
    addEvent("page_closed", parseCallback(payload));
  });

  checkout.setCallback("payment_complete", async payload => {
    const data = parseCallback(payload);
    addEvent("payment_complete", data);
    setStatus("Payment complete", "Retrieving the server-side receipt response...");

    try {
      const receipt = await callBackend("/api/receipt", {
        ticket: data.ticket || currentTicket
      });

      receiptOutput.textContent = JSON.stringify(receipt, null, 2);
      resultTitle.textContent = "Receipt retrieved";
      resultCard.hidden = false;
      setStatus("Complete", "The receipt response was retrieved from Moneris.");
    } catch (error) {
      receiptOutput.textContent = error.message;
      resultTitle.textContent = "Receipt lookup failed";
      resultCard.hidden = false;
      setStatus("Receipt error", error.message);
    }

    checkout.closeCheckout();
    checkoutShell.hidden = true;
    startButton.disabled = false;
  });
}

amountForm.addEventListener("submit", async event => {
  event.preventDefault();

  const amount = amountInput.value.trim();

  if (!validAmount(amount)) {
    setStatus("Check amount", "Enter a positive amount with two decimal places, for example 10.00.");
    return;
  }

  startButton.disabled = true;
  resultCard.hidden = true;
  setStatus("Generating checkout", "Requesting a secure QA checkout ticket from the backend...");

  try {
    const data = await callBackend("/api/initiate-checkout", { amount });

    if (!data.ticket) {
      throw new Error("The backend did not return a Moneris ticket.");
    }

    currentTicket = data.ticket;
    setupCheckout();

    checkoutShell.hidden = false;
    checkout.startCheckout(currentTicket);
  } catch (error) {
    setStatus("Could not start checkout", error.message);
    startButton.disabled = false;
  }
});

closeButton.addEventListener("click", () => {
  if (checkout) checkout.closeCheckout();

  checkoutShell.hidden = true;
  startButton.disabled = false;
  setStatus("Checkout closed", "Enter an amount to generate another checkout instance.");
});
