// Email notification for new inquiries, sent through the Resend HTTP API.
// Delivery is retried: a few quick attempts right after saving, then by the
// cron trigger, so a stored inquiry is never lost to an email outage.

import { updateNotification, type InquiryRecord } from "./db";
import type { Env } from "./env";

export const MAX_ATTEMPTS = 12;

export interface EmailMessage {
  from: string;
  to: string[];
  replyTo: string;
  subject: string;
  text: string;
  html: string;
}

export interface NotifyConfig {
  apiKey: string;
  apiUrl: string;
  from: string;
  to: string[];
}

export function notifyConfig(env: Env): NotifyConfig | null {
  const to = (env.INQUIRY_NOTIFY_TO ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!env.RESEND_API_KEY || !env.INQUIRY_NOTIFY_FROM || to.length === 0) return null;
  return { apiKey: env.RESEND_API_KEY, apiUrl: (env.RESEND_API_URL || "https://api.resend.com").replace(/\/$/, ""), from: env.INQUIRY_NOTIFY_FROM, to };
}

export const MISSING_CONFIG_MESSAGE = "Inquiry notifications are not configured: set RESEND_API_KEY, INQUIRY_NOTIFY_FROM and INQUIRY_NOTIFY_TO.";

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, " ").trim();

export function composeEmail(r: InquiryRecord, config: Pick<NotifyConfig, "from" | "to">): EmailMessage {
  const place = [r.city, r.region, countryName(r.country)].filter(Boolean).join(", ");
  const rows: [string, string][] = [
    ["Laboratory name", r.lab_name],
    ["Company / Legal name", r.company_name ?? "—"],
    ["Contact person", r.contact_name],
    ["Work email", r.email],
    ["Phone number", r.phone_display],
    ["Country", `${countryName(r.country)} (${r.country})`],
    ["State / Region", r.region ?? "—"],
    ["City", r.city],
    ["Current website", r.website ?? "—"],
  ];
  const message = r.message ?? "—";
  const meta: [string, string][] = [
    ["Inquiry ID", r.id],
    ["Received", r.created_at],
    ["Source", r.source],
  ];

  const text = [
    `New website quote request from ${r.source}`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "Message / Requirements:",
    message,
    "",
    ...meta.map(([k, v]) => `${k}: ${v}`),
    "",
    "Reply to this email to answer the contact person directly.",
  ].join("\n");

  const tr = ([k, v]: [string, string]) =>
    `<tr><th align="left" style="padding:6px 16px 6px 0;color:#596067;font-weight:500;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</th><td style="padding:6px 0;color:#22272b">${escapeHtml(v)}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f7f5f0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.5">
<div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #ddd7cc;border-radius:12px;padding:24px">
<p style="margin:0 0 4px;color:#0d6b70;font-weight:600">New website quote request</p>
<h1 style="margin:0 0 16px;font-size:20px;color:#22272b">${escapeHtml(r.lab_name)}</h1>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">${rows.map(tr).join("")}</table>
<h2 style="margin:20px 0 6px;font-size:15px;color:#22272b">Message / Requirements</h2>
<p style="margin:0;white-space:pre-wrap;color:#22272b">${escapeHtml(message)}</p>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:20px;font-size:13px">${meta.map(tr).join("")}</table>
<p style="margin:20px 0 0;color:#596067;font-size:13px">Reply to this email to answer ${escapeHtml(r.contact_name)} directly.</p>
</div></body></html>`;

  return {
    from: config.from,
    to: config.to,
    replyTo: r.email,
    subject: oneLine(`Website inquiry: ${r.lab_name} (${place})`).slice(0, 200),
    text,
    html,
  };
}

export async function sendEmail(config: NotifyConfig, message: EmailMessage, idempotencyKey: string): Promise<void> {
  const res = await fetch(`${config.apiUrl}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      // Resend drops duplicates with the same key, so retries never send twice.
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: message.from,
      to: message.to,
      reply_to: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Email API responded ${res.status}${detail ? `: ${detail}` : ""}`);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Tries to deliver the notification for one stored inquiry and records the
 * outcome. `delays` are the waits before each attempt in this run.
 */
export async function deliver(env: Env, record: InquiryRecord, delays: number[] = [0, 2000, 6000]): Promise<InquiryRecord["notification_status"]> {
  const db = env.DB!;
  const config = notifyConfig(env);
  if (!config) {
    console.error(`[inquiries] ${MISSING_CONFIG_MESSAGE} Inquiry ${record.id} is stored and will be sent once configured.`);
    await updateNotification(db, record.id, { status: "not_configured", attempts: record.notification_attempts, error: MISSING_CONFIG_MESSAGE });
    return "not_configured";
  }
  const message = composeEmail(record, config);
  let attempts = record.notification_attempts;
  let lastError = "";
  for (const delay of delays) {
    if (attempts >= MAX_ATTEMPTS) break;
    if (delay) await sleep(delay);
    attempts += 1;
    try {
      await sendEmail(config, message, `inquiry-${record.id}`);
      await updateNotification(db, record.id, { status: "sent", attempts, error: null, notifiedAt: new Date().toISOString() });
      return "sent";
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[inquiries] Notification attempt ${attempts} for ${record.id} failed: ${lastError}`);
    }
  }
  const status = attempts >= MAX_ATTEMPTS ? "failed" : "pending";
  await updateNotification(db, record.id, { status, attempts, error: lastError.slice(0, 500) });
  return status;
}
