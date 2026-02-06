import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

const app = express();
const port = process.env.PORT || 3000;

const PAY_TO = process.env.PAY_TO; // where USDC should land (0x...)

// Base mainnet: eip155:8453. Base Sepolia: eip155:84532.
const X402_NETWORK = process.env.X402_NETWORK || "eip155:8453";

// For mainnet (CDP facilitator): https://api.cdp.coinbase.com/platform/v2/x402
// For testnet: https://www.x402.org/facilitator
const X402_FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL || "https://api.cdp.coinbase.com/platform/v2/x402";

// Price is in dollars for the "exact" scheme (e.g. "$0.01").
const X402_PRICE = process.env.X402_PRICE || "$0.01";

let x402Enabled = false;

if (!PAY_TO) {
  console.warn("[x402] disabled (missing env: PAY_TO). /paid/hello will return 503.");
} else {
  const routes = {
    "GET /paid/hello": {
      accepts: [
        {
          scheme: "exact",
          network: X402_NETWORK,
          payTo: PAY_TO,
          price: X402_PRICE,
        },
      ],
      description: "Paid hello-world endpoint",
      mimeType: "application/json",
    },
  };

  const facilitatorClient = new HTTPFacilitatorClient({ url: X402_FACILITATOR_URL });
  const server = new x402ResourceServer(facilitatorClient).register(
    X402_NETWORK,
    new ExactEvmScheme()
  );

  app.use(paymentMiddleware(routes, server));
  x402Enabled = true;
}

app.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="base:app_id" content="698616d3785494a0fe86a569" />
  <title>Eric Thee Car</title>
</head>
<body>
  <h1>Yoyoyo</h1>
  <p>Agent endpoint host</p>
  <p>Paid endpoint: <code>/paid/hello</code></p>
</body>
</html>`);
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/paid/hello", (req, res) => {
  if (!x402Enabled) {
    res.status(503).json({
      error: "x402 disabled",
      missing: ["PAY_TO"],
    });
    return;
  }
  res.json({
    message: "hello, paid world",
    paid: true,
  });
});

app.listen(port, () => {
  console.log("listening on", port);
  if (x402Enabled) {
    console.log("x402:", {
      payTo: PAY_TO,
      network: X402_NETWORK,
      price: X402_PRICE,
      facilitator: X402_FACILITATOR_URL,
    });
  }
});
