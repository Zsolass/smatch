// D1 access shared by the two kinds of submission. Tables are created on first
// use, so a freshly provisioned database needs no separate migration step.
// Table and column names come from the code, never from a request.

export type NotificationStatus = "pending" | "sent" | "failed" | "not_configured";

/** Columns every stored submission has. */
export interface BaseRecord {
  id: string;
  idempotency_key: string;
  created_at: string;
  source: string;
  notification_status: NotificationStatus;
  notification_attempts: number;
  notification_error: string | null;
  notified_at: string | null;
}

/** DDL for a submissions table: the shared columns plus the table's own. */
export function tableSchema(table: string, columns: string[], indexes: string[] = []): string[] {
  return [
    `CREATE TABLE IF NOT EXISTS ${table} (
    id TEXT PRIMARY KEY,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    source TEXT NOT NULL,
    ${columns.join(",\n    ")},
    notification_status TEXT NOT NULL DEFAULT 'pending',
    notification_attempts INTEGER NOT NULL DEFAULT 0,
    notification_error TEXT,
    notified_at TEXT
  )`,
    `CREATE INDEX IF NOT EXISTS ${table}_created_at ON ${table} (created_at)`,
    `CREATE INDEX IF NOT EXISTS ${table}_notification ON ${table} (notification_status, created_at)`,
    ...indexes,
  ];
}

const ready = new Map<string, Promise<unknown>>();

export function ensureSchema(db: D1Database, table: string, schema: string[]): Promise<unknown> {
  let pending = ready.get(table);
  if (!pending) {
    pending = db.batch(schema.map((sql) => db.prepare(sql))).catch((err) => {
      ready.delete(table);
      throw err;
    });
    ready.set(table, pending);
  }
  return pending;
}

export function findByIdempotencyKey<R>(db: D1Database, table: string, key: string) {
  return db.prepare(`SELECT * FROM ${table} WHERE idempotency_key = ?`).bind(key).first<R>();
}

/** The latest row since `sinceIso` whose columns match `where` (case-insensitively). */
export function findRecent<R>(db: D1Database, table: string, where: Record<string, string>, sinceIso: string) {
  const columns = Object.keys(where);
  return db
    .prepare(`SELECT * FROM ${table} WHERE ${columns.map((c) => `lower(${c}) = lower(?)`).join(" AND ")} AND created_at >= ? ORDER BY created_at DESC LIMIT 1`)
    .bind(...columns.map((c) => where[c]), sinceIso)
    .first<R>();
}

export async function countRecent(db: D1Database, table: string, column: string, value: string, sinceIso: string): Promise<number> {
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ? AND created_at >= ?`).bind(value, sinceIso).first<{ n: number }>();
  return row?.n ?? 0;
}

export async function insertRow<R extends BaseRecord>(db: D1Database, table: string, record: R): Promise<boolean> {
  const columns = Object.keys(record) as (keyof R & string)[];
  // ON CONFLICT keeps a concurrent retry with the same key from creating a second row.
  const result = await db
    .prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")}) ON CONFLICT (idempotency_key) DO NOTHING`)
    .bind(...columns.map((c) => record[c]))
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export function updateNotification(db: D1Database, table: string, id: string, update: { status: NotificationStatus; attempts: number; error: string | null; notifiedAt?: string | null }) {
  return db
    .prepare(`UPDATE ${table} SET notification_status = ?, notification_attempts = ?, notification_error = ?, notified_at = ? WHERE id = ?`)
    .bind(update.status, update.attempts, update.error, update.notifiedAt ?? null, id)
    .run();
}

export async function listForRetry<R>(db: D1Database, table: string, olderThanIso: string, maxAttempts: number, limit = 20) {
  const { results } = await db
    .prepare(`SELECT * FROM ${table} WHERE notification_status IN ('pending', 'not_configured') AND notification_attempts < ? AND created_at <= ? ORDER BY created_at ASC LIMIT ?`)
    .bind(maxAttempts, olderThanIso, limit)
    .all<R>();
  return results;
}

export async function listRows<R>(db: D1Database, table: string, limit: number, before?: string) {
  const stmt = before
    ? db.prepare(`SELECT * FROM ${table} WHERE created_at < ? ORDER BY created_at DESC LIMIT ?`).bind(before, limit)
    : db.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT ?`).bind(limit);
  const { results } = await stmt.all<R>();
  return results;
}
