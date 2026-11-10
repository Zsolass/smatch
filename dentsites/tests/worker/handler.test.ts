import { describe, expect, it, vi } from "vitest";
import type { Env } from "../../worker/env";
import worker from "../../worker/index";

// `timingSafeEqual` is a Workers extension that Node's Web Crypto lacks.
if (!("timingSafeEqual" in crypto.subtle)) {
  Object.defineProperty(crypto.subtle, "timingSafeEqual", {
    value: (a: ArrayBuffer, b: ArrayBuffer) => {
      const x = new Uint8Array(a), y = new Uint8Array(b);
      return x.length === y.length && x.every((v, i) => v === y[i]);
    },
  });
}

const ctx = { waitUntil: vi.fn(), passThroughOnException: vi.fn(), props: {} } as unknown as ExecutionContext;
const assets = { fetch: vi.fn(async () => new Response("asset")) } as unknown as Fetcher;
const ORIGIN = "https://dentsites.smatch.cloud";

const inquiry = {
  clinicName: "TEST Dental",
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

const consultation = {
  fullName: "Test Patient",
  phoneCountry: "US",
  phone: "(415) 555-2671",
  treatment: "dental-implants",
  contactMethod: "call",
  idempotencyKey: "0f9c8a52-6a3e-4c55-9d0e-222222222222",
  hp: "",
  elapsedMs: 8000,
};

function post(path: string, data: unknown, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}${path}`, {
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

/** A tiny in-memory stand-in for D1 that understands the statements the Worker uses. */
function memoryDb() {
  const tables = new Map<string, Record<string, unknown>[]>();
  const rowsOf = (sql: string) => {
    const table = /(?:FROM|INTO|UPDATE)\s+(\w+)/i.exec(sql)![1]!;
    if (!tables.has(table)) tables.set(table, []);
    return tables.get(table)!;
  };
  const statement = (sql: string, args: unknown[] = []) => ({
    bind: (...bound: unknown[]) => statement(sql, bound),
    async first() {
      const rows = rowsOf(sql);
      if (/COUNT\(\*\)/i.test(sql)) return { n: rows.filter((r) => Object.values(r).includes(args[0])).length };
      if (/idempotency_key = \?/i.test(sql)) return rows.find((r) => r.idempotency_key === args[0]) ?? null;
      // findRecent: every bound value except the trailing timestamp must match a column.
      const wanted = args.slice(0, -1).map((v) => String(v).toLowerCase());
      return rows.find((r) => wanted.every((w) => Object.values(r).some((v) => String(v).toLowerCase() === w))) ?? null;
    },
    async run() {
      if (/^INSERT/i.test(sql)) {
        const columns = /\(([^)]+)\)/.exec(sql)![1]!.split(",").map((c) => c.trim());
        const row = Object.fromEntries(columns.map((c, i) => [c, args[i]]));
        const rows = rowsOf(sql);
        if (rows.some((r) => r.idempotency_key === row.idempotency_key)) return { meta: { changes: 0 } };
        rows.push(row);
        return { meta: { changes: 1 } };
      }
      return { meta: { changes: 1 } };
    },
    async all() {
      return { results: [...rowsOf(sql)] };
    },
  });
  return { db: { prepare: (sql: string) => statement(sql), batch: async () => [] } as unknown as D1Database, tables };
}

describe("POST /api/inquiries", () => {
  it("stores a valid inquiry once and treats a retry as the same inquiry", async () => {
    const { db, tables } = memoryDb();
    const first = await call(post("/api/inquiries", inquiry), { DB: db });
    expect(first.status).toBe(201);
    const body = (await first.json()) as { ok: boolean; id: string; duplicate: boolean };
    expect(body).toMatchObject({ ok: true, duplicate: false });
    const again = await call(post("/api/inquiries", inquiry), { DB: db });
    expect(again.status).toBe(200);
    expect(await again.json()).toMatchObject({ ok: true, id: body.id, duplicate: true });
    expect(tables.get("inquiries")).toHaveLength(1);
    expect(tables.get("inquiries")![0]).toMatchObject({ clinic_name: "TEST Dental", phone: "+36301234567", source: "dentsites.smatch.cloud", notification_status: "pending" });
  });

  it("reports a missing database as a configuration problem", async () => {
    const res = await call(post("/api/inquiries", inquiry), {});
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, error: "not_configured" });
  });

  it("reports storage failures without claiming success", async () => {
    vi.mocked(ctx.waitUntil).mockClear();
    const res = await call(post("/api/inquiries", inquiry), { DB: failingDb });
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ ok: false, error: "storage_failed" });
    expect(ctx.waitUntil).not.toHaveBeenCalled();
  });

  it("rejects filled honeypots, instant submissions and bad input", async () => {
    const env = { DB: failingDb };
    expect((await call(post("/api/inquiries", { ...inquiry, hp: "http://spam" }), env)).status).toBe(400);
    expect(await (await call(post("/api/inquiries", { ...inquiry, elapsedMs: 200 }), env)).json()).toMatchObject({ error: "too_fast" });
    expect(await (await call(post("/api/inquiries", { ...inquiry, idempotencyKey: "x" }), env)).json()).toMatchObject({ error: "invalid_request" });
    expect(await (await call(post("/api/inquiries", "{not json"), env)).json()).toMatchObject({ error: "invalid_json" });
    const invalid = await (await call(post("/api/inquiries", { ...inquiry, email: "nope" }), env)).json();
    expect(invalid).toMatchObject({ error: "validation", fieldErrors: { email: expect.any(String) } });
  });

  it("only accepts same-origin JSON of a sensible size", async () => {
    expect((await call(post("/api/inquiries", inquiry, { Origin: "https://evil.example" }), { DB: failingDb })).status).toBe(403);
    const form = new Request(`${ORIGIN}/api/inquiries`, { method: "POST", headers: { "Content-Type": "text/plain" }, body: "x" });
    expect((await call(form, { DB: failingDb })).status).toBe(415);
    expect((await call(post("/api/inquiries", { ...inquiry, message: "x".repeat(20_000) }), { DB: failingDb })).status).toBe(413);
  });
});

describe("POST /api/consultation-requests", () => {
  it("is switched off on the demo: no patient details are accepted", async () => {
    const { db, tables } = memoryDb();
    for (const env of [{ DB: db }, { DB: db, CONSULTATION_REQUESTS: "off" }]) {
      const res = await call(post("/api/consultation-requests", consultation), env);
      expect(res.status).toBe(403);
      expect(await res.json()).toMatchObject({ ok: false, error: "disabled" });
    }
    expect(tables.size).toBe(0);
  });

  it("when switched on, validates on the server and acknowledges with a reference", async () => {
    const { db, tables } = memoryDb();
    const env = { DB: db, CONSULTATION_REQUESTS: "on" };
    const invalid = await call(post("/api/consultation-requests", { ...consultation, phone: "123", treatment: "nope" }), env);
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ error: "validation", fieldErrors: { phone: expect.any(String), treatment: expect.any(String) } });
    expect(tables.get("consultation_requests") ?? []).toHaveLength(0);

    const res = await call(post("/api/consultation-requests", consultation), env);
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ ok: true, reference: expect.stringMatching(/^REQ-[0-9A-F]{8}$/), duplicate: false });
    expect(tables.get("consultation_requests")![0]).toMatchObject({ full_name: "Test Patient", phone: "+14155552671", treatment: "dental-implants", contact_method: "call" });

    // A double submission does not create a second request.
    const again = await call(post("/api/consultation-requests", { ...consultation, idempotencyKey: "0f9c8a52-6a3e-4c55-9d0e-333333333333" }), env);
    expect(await again.json()).toMatchObject({ ok: true, duplicate: true });
    expect(tables.get("consultation_requests")).toHaveLength(1);
  });
});

describe("admin and other routes", () => {
  it("keeps the lists closed without an admin token", async () => {
    for (const path of ["/api/inquiries", "/api/consultation-requests"]) {
      expect((await call(new Request(`${ORIGIN}${path}`), {})).status).toBe(503);
      const res = await call(new Request(`${ORIGIN}${path}`), { ADMIN_TOKEN: "secret-token-for-tests" });
      expect(res.status).toBe(401);
      expect(res.headers.get("WWW-Authenticate")).toMatch(/Bearer/);
    }
    expect((await call(new Request(`${ORIGIN}/api/retry-notifications`, { method: "POST" }), { ADMIN_TOKEN: "secret-token-for-tests" })).status).toBe(401);
  });

  it("lists stored inquiries for an admin, as JSON or CSV", async () => {
    const { db } = memoryDb();
    const env = { DB: db, ADMIN_TOKEN: "secret-token-for-tests" };
    await call(post("/api/inquiries", { ...inquiry, clinicName: "=SUM(A1)" }), env);
    const auth = { headers: { Authorization: "Bearer secret-token-for-tests" } };
    const list = (await (await call(new Request(`${ORIGIN}/api/inquiries`, auth), env)).json()) as { items: unknown[] };
    expect(list.items).toHaveLength(1);
    const csv = await (await call(new Request(`${ORIGIN}/api/inquiries?format=csv`, auth), env)).text();
    expect(csv.split("\r\n")[0]).toContain("clinic_name");
    expect(csv).toContain(`"'=SUM(A1)"`);
  });

  it("reports what is configured", async () => {
    const health = await (await call(new Request(`${ORIGIN}/api/health`), {})).json();
    expect(health).toEqual({ ok: true, storage: false, notifications: false, consultationRequests: { enabled: false } });
  });

  it("serves other paths from the static export and unknown API paths as 404", async () => {
    expect(await (await call(new Request(`${ORIGIN}/treatments/dental-implants`), {})).text()).toBe("asset");
    expect((await call(new Request(`${ORIGIN}/api/nope`), {})).status).toBe(404);
  });
});
