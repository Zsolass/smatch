export interface Env {
  /** Static site exported by `next build` (./out). */
  ASSETS: Fetcher;
  /** Inquiry storage (D1). Missing binding = endpoint not configured. */
  DB?: D1Database;
  INQUIRY_RATE_LIMITER?: RateLimit;

  // Notification email (set as Worker secrets; see README).
  RESEND_API_KEY?: string;
  /** Override for the Resend API base URL (e.g. a regional endpoint or a test server). */
  RESEND_API_URL?: string;
  /** Comma-separated recipient address(es) on the Smatch side. */
  INQUIRY_NOTIFY_TO?: string;
  /** Verified sender, e.g. "Smatch Labsite <labsite@smatch.cloud>". */
  INQUIRY_NOTIFY_FROM?: string;

  /** Bearer token for reading inquiries via GET /api/inquiries. */
  ADMIN_TOKEN?: string;
}
