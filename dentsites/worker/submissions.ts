// The path every form submission takes: checks, validation, duplicate
// protection, storage, then a notification email that is retried until it is
// delivered. Website inquiries and consultation requests are two "kinds" of
// submission that differ only in their fields, table and email.

import { siteConfig } from "../src/config/site";
import { emailConfig, missingConfigMessage, sendEmail, type EmailConfig, type EmailMessage } from "./email";
import type { Env } from "./env";
import { fail, isAdmin, json, readSubmission, toCsv } from "./http";
import { countRecent, ensureSchema, findByIdempotencyKey, findRecent, insertRow, listForRetry, listRows, updateNotification, type BaseRecord } from "./store";

export const MAX_ATTEMPTS = 12;
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

export interface Kind<D, R extends BaseRecord> {
  /** Log label and the word used in messages: "inquiry" or "request". */
  noun: string;
  table: string;
  schema: string[];
  /** Name of the variable that holds the recipients, and its value. */
  recipientsVar: string;
  recipients(env: Env): string | undefined;
  validate(body: Record<string, unknown>): { ok: true; data: D } | { ok: false; errors: Record<string, string> };
  /** The submission's own columns. */
  toRow(data: D): Omit<R, keyof BaseRecord>;
  /** Columns that identify an accidental resubmission within ten minutes. */
  duplicateKey(data: D): Record<string, string>;
  /** At most `max` submissions per day for one value of `column`. */
  dailyLimit: { column: string; value(data: D): string; max: number; message: string };
  compose(record: R, config: Pick<EmailConfig, "from" | "to">): EmailMessage;
  /** The body of a successful response. */
  receipt(record: R): Record<string, unknown>;
  csvColumns: (keyof R)[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Tries to deliver the notification for one stored submission and records the outcome. */
export async function deliver<D, R extends BaseRecord>(env: Env, kind: Kind<D, R>, record: R, delays: number[] = [0, 2000, 6000]): Promise<R["notification_status"]> {
  const db = env.DB!;
  const config = emailConfig(env, kind.recipients(env));
  if (!config) {
    const missing = missingConfigMessage(env, kind.recipients(env), kind.recipientsVar);
    console.error(`[${kind.noun}] ${missing} ${record.id} is stored and will be sent once configured.`);
    await updateNotification(db, kind.table, record.id, { status: "not_configured", attempts: record.notification_attempts, error: missing });
    return "not_configured";
  }
  const message = kind.compose(record, config);
  let attempts = record.notification_attempts;
  let lastError = "";
  for (const delay of delays) {
    if (attempts >= MAX_ATTEMPTS) break;
    if (delay) await sleep(delay);
    attempts += 1;
    try {
      await sendEmail(config, message, `${kind.noun}-${record.id}`);
      await updateNotification(db, kind.table, record.id, { status: "sent", attempts, error: null, notifiedAt: new Date().toISOString() });
      return "sent";
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[${kind.noun}] Notification attempt ${attempts} for ${record.id} failed: ${lastError}`);
    }
  }
  const status = attempts >= MAX_ATTEMPTS ? "failed" : "pending";
  await updateNotification(db, kind.table, record.id, { status, attempts, error: lastError.slice(0, 500) });
  return status;
}

/** POST: store a submission and notify. Success is reported once it is stored. */
export async function createSubmission<D, R extends BaseRecord>(request: Request, env: Env, ctx: ExecutionContext, kind: Kind<D, R>): Promise<Response> {
  const submission = await readSubmission(request, kind.noun, Boolean(env.DB));
  if (!submission.ok) return submission.response;
  const { body, idempotencyKey } = submission;

  const result = kind.validate(body);
  if (!result.ok) return fail(400, "validation", "Some fields need attention.", { fieldErrors: result.errors });
  const data = result.data;
  const db = env.DB!;
  const accepted = (record: R, duplicate: boolean) => json({ ok: true, ...kind.receipt(record), duplicate }, duplicate ? 200 : 201);

  try {
    await ensureSchema(db, kind.table, kind.schema);

    // A retry of a request we already stored (double click, network retry).
    const existing = await findByIdempotencyKey<R>(db, kind.table, idempotencyKey);
    if (existing) return accepted(existing, true);

    if (env.INQUIRY_RATE_LIMITER) {
      const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
      const { success } = await env.INQUIRY_RATE_LIMITER.limit({ key: `${kind.noun}:${ip}` });
      if (!success) return fail(429, "rate_limited", "Too many requests from your network. Please wait a minute and try again.");
    }

    const now = Date.now();
    const duplicate = await findRecent<R>(db, kind.table, kind.duplicateKey(data), new Date(now - DUPLICATE_WINDOW_MS).toISOString());
    if (duplicate) return accepted(duplicate, true);

    const limit = kind.dailyLimit;
    if ((await countRecent(db, kind.table, limit.column, limit.value(data), new Date(now - 24 * 3600 * 1000).toISOString())) >= limit.max) {
      return fail(429, "rate_limited", limit.message);
    }

    const record = {
      id: crypto.randomUUID(),
      idempotency_key: idempotencyKey,
      created_at: new Date(now).toISOString(),
      source: siteConfig.domain,
      ...kind.toRow(data),
      notification_status: "pending",
      notification_attempts: 0,
      notification_error: null,
      notified_at: null,
    } as unknown as R;
    if (!(await insertRow(db, kind.table, record))) {
      const winner = await findByIdempotencyKey<R>(db, kind.table, idempotencyKey);
      if (winner) return accepted(winner, true);
      throw new Error("Insert was ignored but no matching row was found");
    }

    // Stored: the response no longer depends on email delivery.
    ctx.waitUntil(deliver(env, kind, record).catch((err) => console.error(`[${kind.noun}] Notification failed`, err)));
    return accepted(record, false);
  } catch (err) {
    console.error(`[${kind.noun}] Storage error`, err);
    return fail(500, "storage_failed", `We couldn't save your ${kind.noun}. Your details are still in the form; please try again.`);
  }
}

/** GET (admin): list stored submissions as JSON or CSV. */
export async function listSubmissions<D, R extends BaseRecord>(request: Request, env: Env, kind: Kind<D, R>): Promise<Response> {
  if (!env.ADMIN_TOKEN) return fail(503, "admin_not_configured", "Admin access is not configured (set ADMIN_TOKEN).");
  if (!(await isAdmin(request, env.ADMIN_TOKEN))) {
    return json({ ok: false, error: "unauthorized", message: "A valid admin token is required." }, 401, { "WWW-Authenticate": 'Bearer realm="admin"' });
  }
  if (!env.DB) return fail(503, "not_configured", "Storage is not configured.");
  await ensureSchema(env.DB, kind.table, kind.schema);
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const rows = await listRows<R>(env.DB, kind.table, limit, url.searchParams.get("before") ?? undefined);
  if (url.searchParams.get("format") === "csv") {
    return new Response(toCsv(rows, kind.csvColumns), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${kind.table}.csv"`, "Cache-Control": "no-store" },
    });
  }
  return json({
    ok: true,
    items: rows,
    nextBefore: rows.length === limit ? rows.at(-1)!.created_at : null,
    config: { storage: true, notifications: emailConfig(env, kind.recipients(env)) !== null },
  });
}

/** Cron: resend notifications that failed or were stored before email was configured. */
export async function retryNotifications<D, R extends BaseRecord>(env: Env, kind: Kind<D, R>): Promise<{ attempted: number; sent: number }> {
  if (!env.DB) return { attempted: 0, sent: 0 };
  await ensureSchema(env.DB, kind.table, kind.schema);
  // Skip rows from the last minute: their first delivery (at most 30 s of waitUntil) may still be running.
  const pending = await listForRetry<R>(env.DB, kind.table, new Date(Date.now() - 60 * 1000).toISOString(), MAX_ATTEMPTS);
  if (pending.length && !emailConfig(env, kind.recipients(env))) {
    console.error(`[${kind.noun}] ${pending.length} stored submissions are waiting for notification settings.`);
    return { attempted: 0, sent: 0 };
  }
  let sent = 0;
  for (const record of pending) if ((await deliver(env, kind, record, [0])) === "sent") sent += 1;
  return { attempted: pending.length, sent };
}
