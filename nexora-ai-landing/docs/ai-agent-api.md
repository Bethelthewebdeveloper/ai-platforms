# AI agent plans and API

The project has two local services: the BusinessGrowth API on port `4000` and ZEN on port `5000`. Run `npm start` in one terminal and `npm run start:zen` in another (after installing the dependencies in `zen/server`). Customer API requests go to ZEN. The model provider credential stays in the server environment.

## Draft defaults

| Plan | Monthly tokens | Price | Active API keys | Key lifetime | Per-key token cap |
| --- | ---: | ---: | ---: | ---: | ---: |
| Free | 20,000 | Free | 0 | — | — |
| Pro | 250,000 | ₦9,900/month | 3 | 7 days | 50,000 |
| Business | 1,000,000 | ₦49,900/month | 10 | 30 days | 250,000 |

Monthly allowances reset on the first day of each UTC calendar month. A one-time top-up defaults to 100,000 tokens for ₦4,990. All defaults can be changed using the `AI_*` entries in `.env`.

## Enable payments

Create monthly Pro and Business plans in Paystack using the matching prices and copy their plan codes into `PAYSTACK_PRO_PLAN_CODE` and `PAYSTACK_BUSINESS_PLAN_CODE`. Set `PAYSTACK_SECRET_KEY` on the server, and configure the Paystack webhook to `https://YOUR_PUBLIC_HOST/api/billing/paystack/webhook`. For current `Paystack-Signature` verification, set the webhook signing secret in `PAYSTACK_WEBHOOK_SECRET`; legacy `x-paystack-signature` events use `PAYSTACK_SECRET_KEY`. Set `PAYSTACK_CALLBACK_URL` to your dashboard's return page. Keep the secrets out of frontend code and source control. Checkout stays disabled until the needed credentials and plan codes are present.

The webhook accepts only signed `charge.success` events that match a pending checkout reference, amount, and NGN currency. Configure the callback for a public HTTPS URL when deploying.

## Create an API key

In either dashboard, open **AI Plans** to choose a plan and **Integrations** to generate a named API key and see the connection example. The full key appears once. Copy it into a server-side secret store. It cannot be retrieved later; revoke it and create a replacement if lost.

## Call the agent

```http
POST http://localhost:5000/v1/agents/run
X-API-Key: nx_your_key
Content-Type: application/json
```

```json
{"prompt":"Summarize this customer feedback"}
```

The JSON response includes `output` and token usage. Calls stop when the monthly allowance, purchased token balance, or per-key cap is exhausted. Responses use HTTP `402` for exhausted usage.
