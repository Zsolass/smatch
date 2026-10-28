// POST /api/inquiries  – store a website quote request and notify Smatch
// GET  /api/inquiries  – list stored inquiries (admin token required)
// POST /api/inquiries/retry-notifications – resend pending notifications (admin)

import { siteConfig } from "../src/config/site";
import { coerceInquiry, validateInquiry } from "../src/lib/inquiry/schema";
import {
  countRecentByEmail,
  ensureSchema,
  findByIdempotencyKey,
  findRecentDuplicate,
  insertInquiry,
  listForRetry,
  listInquiries,
  type InquiryRecord,
} from "./db";
import type { Env } from "./env";
import { deliver, MAX_ATTEMPTS, notifyConfig } from "./notify";

const MAX_BODY_BYTES = 16 * 1024;
const MIN_FILL_MS = 2500;
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_EMAIL_PER_DAY = 5;

export function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

const fail = (status: number, error: string, message: string, extra: Record<string, unknown> = {}) =>
  json({ ok: false, error, message, ...extra }, status);

const accepted = (record: Pick<InquiryRecord, "id">, duplicate: boolean) => json({ ok: true, id: record.id, duplicate }, duplicate ? 200 : 201);

export async function createInquiry(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const origin = request.headers.get("Origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return fail(403, "forbidden_origin", "Inquiries can only be sent from this website.");
  }
  if (!(request.headers.get("Content-Type") ?? "").toLowerCase().startsWith("application/json")) {
    return fail(415, "unsupported_media_type", "Send the inquiry as JSON.");
  }
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY_BYTES) {
    return fail(413, "payload_too_large", "The inquiry is too large.");
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return fail(413, "payload_too_large", "The inquiry is too large.");

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return fail(400, "invalid_json", "The inquiry could not be read.");
  }

  if (!env.DB) {
    console.error("[inquiries] D1 binding DB is missing: the inquiry endpoint is not configured.");
    return fail(503, "not_configured", "The inquiry service is not configured on this deployment yet.");
  }

  // Simple spam checks: a hidden field people never see, and a minimum fill time.
  if (typeof body.hp === "string" && body.hp.trim() !== "") {
    return fail(400, "rejected", "Your inquiry could not be accepted. Please contact us another way.");
  }
  if (typeof body.elapsedMs !== "number" || body.elapsedMs < MIN_FILL_MS) {
    return fail(400, "too_fast", "That was quick! Please check your details and send the form again.");
  }

  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey : "";
  if (!/^[A-Za-z0-9-]{16,64}$/.test(idempotencyKey)) {
    return fail(400, "invalid_request", "The inquiry could not be read. Reload the page and try again.");
  }

  const result = validateInquiry(coerceInquiry(body));
  if (!result.ok) {
    return fail(400, "validation", "Some fields need attention.", { fieldErrors: result.errors });
  }
  const data = result.data;
  const db = env.DB;

  try {
    await ensureSchema(db);

    // A retry of a request we already stored (double click, network retry).
    const existing = await findByIdempotencyKey(db, idempotencyKey);
    if (existing) return accepted(existing, true);

    if (env.INQUIRY_RATE_LIMITER) {
      const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
      const { success } = await env.INQUIRY_RATE_LIMITER.limit({ key: `inquiry:${ip}` });
      if (!success) return fail(429, "rate_limited", "Too many inquiries from your network. Please wait a minute and try again.");
    }

    const now = Date.now();
    const duplicate = await findRecentDuplicate(db, data.email, data.labName, new Date(now - DUPLICATE_WINDOW_MS).toISOString());
    if (duplicate) return accepted(duplicate, true);

    if ((await countRecentByEmail(db, data.email, new Date(now - 24 * 3600 * 1000).toISOString())) >= MAX_PER_EMAIL_PER_DAY) {
      return fail(429, "rate_limited", "We've already received several inquiries from this email today. We'll be in touch.");
    }

    const { record, inserted } = await insertInquiry(db, data, {
      id: crypto.randomUUID(),
      idempotencyKey,
      createdAt: new Date(now).toISOString(),
      source: siteConfig.domain,
    });
    if (!inserted) {
      const winner = await findByIdempotencyKey(db, idempotencyKey);
      if (winner) return accepted(winner, true);
      throw new Error("Insert was ignored but no matching inquiry was found");
    }

    // The inquiry is stored; the response no longer depends on email delivery.
    ctx.waitUntil(deliver(env, record).catch((err) => console.error("[inquiries] Notification failed", err)));
    return accepted(record, false);
  } catch (err) {
    console.error("[inquiries] Storage error", err);
    return fail(500, "storage_failed", "We couldn't save your inquiry. Your details are still in the form; please try again.");
  }
}

async function isAdmin(request: Request, env: Env): Promise<boolean> {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !env.ADMIN_TOKEN) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(token)),
    crypto.subtle.digest("SHA-256", enc.encode(env.ADMIN_TOKEN)),
  ]);
  return crypto.subtle.timingSafeEqual(a, b);
}

const CSV_COLUMNS: (keyof InquiryRecord)[] = [
  "id", "created_at", "source", "lab_name", "company_name", "contact_name", "email", "phone_display", "country", "region", "city", "website",
  "message", "notification_status", "notification_attempts", "notified_at",
];

function toCsv(rows: InquiryRecord[]): string {
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    // Neutralise spreadsheet formulas and quote everything.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [CSV_COLUMNS.join(","), ...rows.map((r) => CSV_COLUMNS.map((c) => cell(r[c])).join(","))].join("\r\n");
}

export async function listInquiriesHandler(request: Request, env: Env): Promise<Response> {
  if (!env.ADMIN_TOKEN) return fail(503, "admin_not_configured", "Admin access is not configured (set ADMIN_TOKEN).");
  if (!(await isAdmin(request, env))) {
    return json({ ok: false, error: "unauthorized", message: "A valid admin token is required." }, 401, { "WWW-Authenticate": 'Bearer realm="inquiries"' });
  }
  if (!env.DB) return fail(503, "not_configured", "Inquiry storage is not configured.");
  await ensureSchema(env.DB);
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const before = url.searchParams.get("before") ?? undefined;
  const rows = await listInquiries(env.DB, limit, before);
  if (url.searchParams.get("format") === "csv") {
    return new Response(toCsv(rows), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="inquiries.csv"', "Cache-Control": "no-store" },
    });
  }
  return json({
    ok: true,
    inquiries: rows,
    nextBefore: rows.length === limit ? rows.at(-1)!.created_at : null,
    config: { storage: true, notifications: notifyConfig(env) !== null },
  });
}

/** POST /api/inquiries/retry-notifications – run the cron retry now (admin). */
export async function retryNotificationsHandler(request: Request, env: Env): Promise<Response> {
  if (!env.ADMIN_TOKEN) return fail(503, "admin_not_configured", "Admin access is not configured (set ADMIN_TOKEN).");
  if (!(await isAdmin(request, env))) return fail(401, "unauthorized", "A valid admin token is required.");
  const result = await retryNotifications(env);
  return json({ ok: true, ...result });
}

/** Cron: resend notifications that failed or were stored before email was configured. */
export async function retryNotifications(env: Env): Promise<{ attempted: number; sent: number }> {
  if (!env.DB) return { attempted: 0, sent: 0 };
  await ensureSchema(env.DB);
  // Skip rows from the last minute: their first delivery (at most 30 s of
  // waitUntil) may still be running.
  const pending = await listForRetry(env.DB, new Date(Date.now() - 60 * 1000).toISOString(), MAX_ATTEMPTS);
  if (pending.length && !notifyConfig(env)) {
    console.error(`[inquiries] ${pending.length} inquiries are waiting for notification settings.`);
    return { attempted: 0, sent: 0 };
  }
  let sent = 0;
  for (const record of pending) if ((await deliver(env, record, [0])) === "sent") sent += 1;
  return { attempted: pending.length, sent };
}
