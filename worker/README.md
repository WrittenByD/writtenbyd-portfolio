# Moneris Checkout QA Worker

This small Cloudflare Worker keeps Moneris credentials off the public GitHub Pages site.

## Routes

- `POST /api/initiate-checkout`
  - Input: `{ "amount": "10.00" }`
  - Sends the QA preload request to Moneris.
  - Returns only the Moneris checkout ticket to the browser.

- `POST /api/receipt`
  - Input: `{ "ticket": "..." }`
  - Sends the QA receipt request to Moneris.
  - Returns the receipt response.

## Required Worker secrets / variables

- `MONERIS_STORE_ID`
- `MONERIS_API_TOKEN`
- `MONERIS_CHECKOUT_ID`
- `ALLOWED_ORIGIN` = `https://writtenbyd.com`

Do not put the Store ID, API token, or Checkout ID in the public browser JavaScript.

## Front-end configuration

After deploying the Worker, copy its public URL and replace:

```js
const API_BASE = "YOUR_WORKER_URL";
```

in `moneris-checkout-demo.js`.

Example:

```js
const API_BASE = "https://writtenbyd-moneris.your-subdomain.workers.dev";
```
