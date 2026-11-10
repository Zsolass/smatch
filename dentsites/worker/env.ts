export interface Env {
  /** Static site exported by `next build` (./out). */
  ASSETS: Fetcher;
  /** Storage (D1). Missing binding = the endpoints are not configured. */
  DB?: D1Database;
  INQUIRY_RATE_LIMITER?: RateLimit;

  // Notification email (set as Worker secrets; see README).
  RESEND_API_KEY?: string;
  /** Override for the Resend API base URL (e.g. a regional endpoint or a test server). */
  RESEND_API_URL?: string;
  /** Verified sender, e.g. "Smatch Dentsite <dentsite@notify.smatch.cloud>". */
  INQUIRY_NOTIFY_FROM?: string;
  /** Comma-separated recipient(s) of website inquiries: the Smatch team. */
  INQUIRY_NOTIFY_TO?: string;

  /** "on" lets the site accept patient consultation requests. Anything else: refused. */
  CONSULTATION_REQUESTS?: string;
  /** Comma-separated recipient(s) of consultation requests: the clinic's inbox. */
  CONSULTATION_NOTIFY_TO?: string;

  /** Bearer token for the admin endpoints. */
  ADMIN_TOKEN?: string;
}
