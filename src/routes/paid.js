export function paidHello(req, res) {
  res.json({
    message: "hello, paid world",
    paid: true,
  });
}

