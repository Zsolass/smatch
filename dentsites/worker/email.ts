// Notification email through the Resend HTTP API.

import type { Env } from "./env";

export interface EmailMessage {
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailConfig {
  apiKey: string;
  apiUrl: string;
  from: string;
  to: string[];
}

const recipients = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Email settings for one recipient list, or null when something is missing. */
export function emailConfig(env: Env, to: string | undefined): EmailConfig | null {
  const list = recipients(to);
  if (!env.RESEND_API_KEY || !env.INQUIRY_NOTIFY_FROM || list.length === 0) return null;
  return { apiKey: env.RESEND_API_KEY, apiUrl: (env.RESEND_API_URL || "https://api.resend.com").replace(/\/$/, ""), from: env.INQUIRY_NOTIFY_FROM, to: list };
}

/** Names only the settings this deployment lacks. `toName` is the recipient variable's name. */
export function missingConfigMessage(env: Env, to: string | undefined, toName: string): string {
  const names: string[] = [];
  if (!env.RESEND_API_KEY) names.push("RESEND_API_KEY");
  if (!env.INQUIRY_NOTIFY_FROM) names.push("INQUIRY_NOTIFY_FROM");
  if (recipients(to).length === 0) names.push(toName);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
  return `Notifications are not configured: set ${list}.`;
}

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, " ").trim();

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

type Row = [string, string];

/** Plain-text and HTML bodies from labelled rows; every value is escaped. */
export function renderEmail(parts: { kicker: string; heading: string; intro: string; rows: Row[]; messageLabel: string; message: string; meta: Row[]; footer: string }) {
  const text = [parts.intro, "", ...parts.rows.map(([k, v]) => `${k}: ${v}`), "", `${parts.messageLabel}:`, parts.message, "", ...parts.meta.map(([k, v]) => `${k}: ${v}`), "", parts.footer].join("\n");
  const tr = ([k, v]: Row) =>
    `<tr><th align="left" style="padding:6px 16px 6px 0;color:#5b625f;font-weight:500;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</th><td style="padding:6px 0;color:#22272a">${escapeHtml(v)}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f7f2e8;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.5">
<div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #dcd3c2;border-radius:12px;padding:24px">
<p style="margin:0 0 4px;color:#1f4d3f;font-weight:600">${escapeHtml(parts.kicker)}</p>
<h1 style="margin:0 0 16px;font-size:20px;color:#22272a">${escapeHtml(parts.heading)}</h1>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">${parts.rows.map(tr).join("")}</table>
<h2 style="margin:20px 0 6px;font-size:15px;color:#22272a">${escapeHtml(parts.messageLabel)}</h2>
<p style="margin:0;white-space:pre-wrap;color:#22272a">${escapeHtml(parts.message)}</p>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:20px;font-size:13px">${parts.meta.map(tr).join("")}</table>
<p style="margin:20px 0 0;color:#5b625f;font-size:13px">${escapeHtml(parts.footer)}</p>
</div></body></html>`;
  return { text, html };
}

export async function sendEmail(config: EmailConfig, message: EmailMessage, idempotencyKey: string): Promise<void> {
  const res = await fetch(`${config.apiUrl}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      // Resend drops duplicates with the same key, so retries never send twice.
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from: message.from, to: message.to, reply_to: message.replyTo, subject: message.subject, text: message.text, html: message.html }),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Email API responded ${res.status}${detail ? `: ${detail}` : ""}`);
  }
}
