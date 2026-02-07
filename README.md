# eric-x402

Simple x402 agent endpoint verification app.

## Usage

1. Clone this repository
2. Install deps: `npm install`
3. Configure env (see `.env.example`)
4. Run: `npm start`
5. App runs on port 3000 by default

## Environment

- `PORT`: Optional port override (default: 3000)
- `PAY_TO`: Seller wallet address where USDC should land (required for x402)
- `X402_NETWORK`: CAIP-2 network id (default: `eip155:8453` for Base mainnet)
- `X402_FACILITATOR_URL`: Facilitator URL (default: public facilitator)
- `X402_PRICE`: Price in dollars for "exact" scheme (default: `$0.01`)
- `CDP_API_KEY_ID`: CDP API key id (needed for CDP facilitator in some setups)
- `CDP_API_KEY_SECRET`: CDP API key secret (needed for CDP facilitator in some setups)

## Verification

x402 will verify this endpoint using the `base:app_id` meta tag.

## Paid Endpoint

- `GET /paid/hello`
  - If `PAY_TO` is missing: returns `503` with a JSON error (app still boots)
  - Without payment: returns `402 Payment Required` (this is expected)
  - With payment: returns `200` with JSON

Test (no payment):

```bash
curl -i https://YOUR_APP_URL/paid/hello
```

## Facilitators (Why You Saw 401)

If you point `X402_FACILITATOR_URL` at the CDP facilitator (`https://api.cdp.coinbase.com/platform/v2/x402`),
you must also set `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET`. Otherwise the facilitator returns `401 Unauthorized`
and (without the defensive init changes in this repo) Express can crash.

## Deploy

Can be deployed to Railway, Vercel, or any Node.js hosting platform.

## GitHub

Created by erictheecat for Daydreams PoC verification.
