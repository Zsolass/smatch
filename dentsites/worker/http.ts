// Response helpers and the checks every form submission passes before it is
// looked at: same origin, JSON, size, a hidden field and a minimum fill time.

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

export const fail = (status: number, error: string, message: string, extra: Record<string, unknown> = {}) => json({ ok: false, error, message, ...extra }, status);

const MAX_BODY_BYTES = 16 * 1024;
const MIN_FILL_MS = 2500;

export type Submission = { ok: true; body: Record<string, unknown>; idempotencyKey: string } | { ok: false; response: Response };

/** Reads a form submission. `noun` names it in messages: "inquiry" or "request". */
export async function readSubmission(request: Request, noun: string, hasStorage: boolean): Promise<Submission> {
  const no = (response: Response): Submission => ({ ok: false, response });
  const origin = request.headers.get("Origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return no(fail(403, "forbidden_origin", "This form can only be sent from this website."));
  if (!(request.headers.get("Content-Type") ?? "").toLowerCase().startsWith("application/json")) return no(fail(415, "unsupported_media_type", `Send the ${noun} as JSON.`));
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY_BYTES) return no(fail(413, "payload_too_large", `The ${noun} is too large.`));
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return no(fail(413, "payload_too_large", `The ${noun} is too large.`));

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return no(fail(400, "invalid_json", `The ${noun} could not be read.`));
  }

  if (!hasStorage) {
    console.error(`[${noun}] D1 binding DB is missing: the endpoint is not configured.`);
    return no(fail(503, "not_configured", "This service is not configured on this deployment yet."));
  }

  // Simple spam checks: a hidden field people never see, and a minimum fill time.
  if (typeof body.hp === "string" && body.hp.trim() !== "") return no(fail(400, "rejected", `Your ${noun} could not be accepted. Please contact us another way.`));
  if (typeof body.elapsedMs !== "number" || body.elapsedMs < MIN_FILL_MS) return no(fail(400, "too_fast", "That was quick! Please check your details and send the form again."));

  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey : "";
  if (!/^[A-Za-z0-9-]{16,64}$/.test(idempotencyKey)) return no(fail(400, "invalid_request", `The ${noun} could not be read. Reload the page and try again.`));

  return { ok: true, body, idempotencyKey };
}

export async function isAdmin(request: Request, adminToken: string | undefined): Promise<boolean> {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !adminToken) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(token)), crypto.subtle.digest("SHA-256", enc.encode(adminToken))]);
  return crypto.subtle.timingSafeEqual(a, b);
}

export function toCsv<R extends object>(rows: R[], columns: (keyof R)[]): string {
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    // Neutralise spreadsheet formulas and quote everything.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [columns.join(","), ...rows.map((r) => columns.map((c) => cell(r[c])).join(","))].join("\r\n");
}
