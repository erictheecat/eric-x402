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
- `AGENT_PRIVATE_KEY`: Agent EOA private key (required)
- `CHAIN_ID`: Must be `8453` for Base mainnet (required)
- `RPC_URL`: Base mainnet RPC URL (required)

## Verification

x402 will verify this endpoint using the `base:app_id` meta tag.

## Paid Endpoint

- `GET /paid/hello`
  - Without payment: returns `402 Payment Required` (this is expected)
  - With payment: returns `200` with JSON

Test (no payment):

```bash
curl -i https://YOUR_APP_URL/paid/hello
```

## Deploy

Can be deployed to Railway, Vercel, or any Node.js hosting platform.

## GitHub

Created by erictheecat for Daydreams PoC verification.
