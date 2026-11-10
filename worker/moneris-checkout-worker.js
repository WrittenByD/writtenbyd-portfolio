const MONERIS_URL = "https://gatewayt.moneris.com/chktv2/request/request.php";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    const allowedOrigins = [
      "https://writtenbyd.com",
      "http://127.0.0.1:5500",
      "http://localhost:5500"
    ];

    const corsHeaders = {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    if (allowedOrigins.includes(origin)) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed." }, 405, corsHeaders);
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/initiate-checkout") {
        return await initiateCheckout(request, env, corsHeaders);
      }

      if (url.pathname === "/api/receipt") {
        return await getReceipt(request, env, corsHeaders);
      }

      return json({ error: "Not found." }, 404, corsHeaders);
    } catch (error) {
      return json({ error: error.message || "Unexpected server error." }, 500, corsHeaders);
    }
  }
};

async function initiateCheckout(request, env, headers) {
  const body = await request.json();
  const amount = String(body.amount || "").trim();

  if (!/^\d+(\.\d{2})$/.test(amount) || Number(amount) <= 0) {
    return json({ error: "Amount must be a positive value with two decimal places." }, 400, headers);
  }

  const monerisResponse = await postToMoneris({
    store_id: env.MONERIS_STORE_ID,
    api_token: env.MONERIS_API_TOKEN,
    checkout_id: env.MONERIS_CHECKOUT_ID,
    txn_total: amount,
    environment: "qa",
    action: "preload"
  });

  const ticket =
    monerisResponse.ticket ||
    monerisResponse.response?.ticket;

  if (!ticket) {
    return json({
      error: "Moneris did not return a checkout ticket.",
      moneris: monerisResponse
    }, 502, headers);
  }

  return json({ ticket }, 200, headers);
}

async function getReceipt(request, env, headers) {
  const body = await request.json();
  const ticket = String(body.ticket || "").trim();

  if (!ticket) {
    return json({ error: "Ticket is required." }, 400, headers);
  }

  const monerisResponse = await postToMoneris({
    store_id: env.MONERIS_STORE_ID,
    api_token: env.MONERIS_API_TOKEN,
    checkout_id: env.MONERIS_CHECKOUT_ID,
    ticket,
    environment: "qa",
    action: "receipt"
  });

  return json(monerisResponse, 200, headers);
}

async function postToMoneris(payload) {
  const response = await fetch(MONERIS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Moneris returned a non-JSON response.");
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || "Moneris request failed.");
  }

  return data;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}
