import { describe, expect, it, vi } from "vitest";
import type { Env } from "../../worker/env";
import worker from "../../worker/index";

const ctx = { waitUntil: vi.fn(), passThroughOnException: vi.fn(), props: {} } as unknown as ExecutionContext;
const assets = { fetch: vi.fn(async () => new Response("asset")) } as unknown as Fetcher;

const body = {
  labName: "TEST Lab",
  contactName: "Test Person",
  email: "test@example.com",
  phoneCountry: "HU",
  phone: "06 30 123 4567",
  country: "HU",
  city: "Budapest",
  idempotencyKey: "0f9c8a52-6a3e-4c55-9d0e-111111111111",
  hp: "",
  elapsedMs: 8000,
};

function post(data: unknown, headers: Record<string, string> = {}) {
  return new Request("https://labsites.smatch.cloud/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof data === "string" ? data : JSON.stringify(data),
  });
}

const call = (req: Request, env: Partial<Env>) => worker.fetch!(req as never, { ASSETS: assets, ...env } as Env, ctx);

const failingDb = {
  prepare: () => {
    throw new Error("D1 unavailable");
  },
  batch: async () => {
    throw new Error("D1 unavailable");
  },
} as unknown as D1Database;

describe("POST /api/inquiries", () => {
  it("reports a missing database as a configuration problem", async () => {
    const res = await call(post(body), {});
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, error: "not_configured" });
  });

  it("reports storage failures without claiming success", async () => {
    const res = await call(post(body), { DB: failingDb });
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ ok: false, error: "storage_failed" });
    expect(ctx.waitUntil).not.toHaveBeenCalled();
  });

  it("rejects filled honeypots, instant submissions and bad input", async () => {
    const env = { DB: failingDb };
    expect((await call(post({ ...body, hp: "http://spam" }), env)).status).toBe(400);
    expect(await (await call(post({ ...body, elapsedMs: 200 }), env)).json()).toMatchObject({ error: "too_fast" });
    expect(await (await call(post({ ...body, idempotencyKey: "x" }), env)).json()).toMatchObject({ error: "invalid_request" });
    expect(await (await call(post("{not json"), env)).json()).toMatchObject({ error: "invalid_json" });
    const invalid = await (await call(post({ ...body, email: "nope" }), env)).json();
    expect(invalid).toMatchObject({ error: "validation", fieldErrors: { email: expect.any(String) } });
  });

  it("only accepts same-origin JSON", async () => {
    expect((await call(post(body, { Origin: "https://evil.example" }), { DB: failingDb })).status).toBe(403);
    const form = new Request("https://labsites.smatch.cloud/api/inquiries", { method: "POST", headers: { "Content-Type": "text/plain" }, body: "x" });
    expect((await call(form, { DB: failingDb })).status).toBe(415);
  });

  it("rejects oversized bodies", async () => {
    expect((await call(post({ ...body, message: "x".repeat(20_000) }), { DB: failingDb })).status).toBe(413);
  });
});

describe("GET /api/inquiries", () => {
  it("is closed when no admin token is configured", async () => {
    const res = await call(new Request("https://labsites.smatch.cloud/api/inquiries"), {});
    expect(res.status).toBe(503);
  });

  it("requires a bearer token", async () => {
    const res = await call(new Request("https://labsites.smatch.cloud/api/inquiries"), { ADMIN_TOKEN: "secret-token-for-tests" });
    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toMatch(/Bearer/);
  });
});

it("serves other paths from the static export", async () => {
  const res = await call(new Request("https://labsites.smatch.cloud/submit-case"), {});
  expect(await res.text()).toBe("asset");
});
