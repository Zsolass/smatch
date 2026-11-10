// Stand-in for the Resend API during end-to-end tests. Records every email
// and can be told to fail, to exercise the retry path.
import http from "node:http";

const port = Number(process.env.MOCK_EMAIL_PORT ?? 8789);
let emails = [];
let failNext = 0;

const send = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

http
  .createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const url = new URL(req.url, "http://localhost");
      if (req.method === "POST" && url.pathname === "/emails") {
        if (failNext > 0) {
          failNext -= 1;
          return send(res, 503, { message: "mock outage" });
        }
        const body = JSON.parse(raw || "{}");
        emails.push({ body, auth: req.headers.authorization, idempotencyKey: req.headers["idempotency-key"] });
        return send(res, 200, { id: `mock-${emails.length}` });
      }
      if (req.method === "GET" && url.pathname === "/__emails") return send(res, 200, emails);
      if (req.method === "POST" && url.pathname === "/__fail") {
        failNext = Number(url.searchParams.get("count") ?? 1);
        return send(res, 200, { failNext });
      }
      if (req.method === "GET" && url.pathname === "/health") return send(res, 200, { ok: true });
      send(res, 404, { message: "not found" });
    });
  })
  .listen(port, "127.0.0.1", () => console.log(`mock email server on ${port}`));
