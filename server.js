import express from "express";
import { createX402Middleware } from "./src/payments/x402.js";
import { paidHello } from "./src/routes/paid.js";

const app = express();

// Free health/homepage (keep base:app_id meta tag for verification tooling).
app.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="base:app_id" content="698616d3785494a0fe86a569" />
  <title>Eric x402</title>
</head>
<body>
  <h1>OpenClaw agent alive</h1>
  <p>Paid endpoint: <code>/paid/hello</code></p>
</body>
</html>`);
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const { middleware: x402, agentAddress } = await createX402Middleware();

// Paid endpoint (business logic does not know about payment mechanics).
app.get("/paid/hello", x402, paidHello);

// Ensure async middleware errors do not crash the process.
// (Express 4 does not automatically catch async exceptions.)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("listening on", port);
  console.log("agent wallet:", agentAddress);
});

