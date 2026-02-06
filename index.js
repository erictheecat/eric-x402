import express from "express";

const app = express();
const port = process.env.PORT || 3000;

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
</body>
</html>`);
});

app.listen(port, () => {
  console.log("listening on", port);
});
