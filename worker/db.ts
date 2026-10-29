// D1 access for inquiries. The table is created on first use, so a freshly
// provisioned database needs no separate migration step.

import type { Inquiry } from "../src/lib/inquiry/schema";

export type NotificationStatus = "pending" | "sent" | "failed" | "not_configured";

export interface InquiryRecord {
  id: string;
  idempotency_key: string;
  created_at: string;
  source: string;
  lab_name: string;
  company_name: string | null;
  contact_name: string;
  email: string;
  phone: string;
  phone_display: string;
  phone_country: string;
  country: string;
  region: string | null;
  city: string;
  website: string | null;
  message: string | null;
  notification_status: NotificationStatus;
  notification_attempts: number;
  notification_error: string | null;
  notified_at: string | null;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    source TEXT NOT NULL,
    lab_name TEXT NOT NULL,
    company_name TEXT,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    phone_display TEXT NOT NULL,
    phone_country TEXT NOT NULL,
    country TEXT NOT NULL,
    region TEXT,
    city TEXT NOT NULL,
    website TEXT,
    message TEXT,
    notification_status TEXT NOT NULL DEFAULT 'pending',
    notification_attempts INTEGER NOT NULL DEFAULT 0,
    notification_error TEXT,
    notified_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS inquiries_created_at ON inquiries (created_at)`,
  `CREATE INDEX IF NOT EXISTS inquiries_email_created ON inquiries (email, created_at)`,
  `CREATE INDEX IF NOT EXISTS inquiries_notification ON inquiries (notification_status, created_at)`,
];

let ready: Promise<unknown> | null = null;

export function ensureSchema(db: D1Database): Promise<unknown> {
  ready ??= db.batch(SCHEMA.map((sql) => db.prepare(sql))).catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

export function findByIdempotencyKey(db: D1Database, key: string) {
  return db.prepare("SELECT * FROM inquiries WHERE idempotency_key = ?").bind(key).first<InquiryRecord>();
}

/** Same lab and email within the window: treat as an accidental resubmission. */
export function findRecentDuplicate(db: D1Database, email: string, labName: string, sinceIso: string) {
  return db
    .prepare("SELECT * FROM inquiries WHERE email = ? AND lower(lab_name) = lower(?) AND created_at >= ? ORDER BY created_at DESC LIMIT 1")
    .bind(email, labName, sinceIso)
    .first<InquiryRecord>();
}

export async function countRecentByEmail(db: D1Database, email: string, sinceIso: string): Promise<number> {
  const row = await db.prepare("SELECT COUNT(*) AS n FROM inquiries WHERE email = ? AND created_at >= ?").bind(email, sinceIso).first<{ n: number }>();
  return row?.n ?? 0;
}

export async function insertInquiry(db: D1Database, data: Inquiry, meta: { id: string; idempotencyKey: string; createdAt: string; source: string }) {
  const record: InquiryRecord = {
    id: meta.id,
    idempotency_key: meta.idempotencyKey,
    created_at: meta.createdAt,
    source: meta.source,
    lab_name: data.labName,
    company_name: data.companyName || null,
    contact_name: data.contactName,
    email: data.email,
    phone: data.phoneE164,
    phone_display: data.phoneDisplay,
    phone_country: data.phoneCountry,
    country: data.country,
    region: data.region || null,
    city: data.city,
    website: data.website || null,
    message: data.message || null,
    notification_status: "pending",
    notification_attempts: 0,
    notification_error: null,
    notified_at: null,
  };
  const columns = Object.keys(record) as (keyof InquiryRecord)[];
  // ON CONFLICT keeps a concurrent retry with the same key from creating a second row.
  const result = await db
    .prepare(`INSERT INTO inquiries (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")}) ON CONFLICT (idempotency_key) DO NOTHING`)
    .bind(...columns.map((c) => record[c]))
    .run();
  return { record, inserted: (result.meta.changes ?? 0) > 0 };
}

export function updateNotification(
  db: D1Database,
  id: string,
  update: { status: NotificationStatus; attempts: number; error: string | null; notifiedAt?: string | null },
) {
  return db
    .prepare("UPDATE inquiries SET notification_status = ?, notification_attempts = ?, notification_error = ?, notified_at = ? WHERE id = ?")
    .bind(update.status, update.attempts, update.error, update.notifiedAt ?? null, id)
    .run();
}

export async function listForRetry(db: D1Database, olderThanIso: string, maxAttempts: number, limit = 20) {
  const { results } = await db
    .prepare(
      "SELECT * FROM inquiries WHERE notification_status IN ('pending', 'not_configured') AND notification_attempts < ? AND created_at <= ? ORDER BY created_at ASC LIMIT ?",
    )
    .bind(maxAttempts, olderThanIso, limit)
    .all<InquiryRecord>();
  return results;
}

export async function listInquiries(db: D1Database, limit: number, before?: string) {
  const stmt = before
    ? db.prepare("SELECT * FROM inquiries WHERE created_at < ? ORDER BY created_at DESC LIMIT ?").bind(before, limit)
    : db.prepare("SELECT * FROM inquiries ORDER BY created_at DESC LIMIT ?").bind(limit);
  const { results } = await stmt.all<InquiryRecord>();
  return results;
}
