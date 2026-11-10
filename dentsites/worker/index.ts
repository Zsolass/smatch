// Worker entry: serves the static export and the /api/* routes.
//
// POST /api/inquiries                 – website quote request from a clinic owner (stored, emailed to Smatch)
// GET  /api/inquiries                 – list them (admin token)
// POST /api/consultation-requests     – patient consultation request (live clinic sites only)
// GET  /api/consultation-requests     – list them (admin token)
// POST /api/retry-notifications       – resend pending notification emails now (admin token)
// GET  /api/health                    – what is configured
import { consultationKind } from "./consultations";
import { emailConfig } from "./email";
import type { Env } from "./env";
import { fail, isAdmin, json } from "./http";
import { inquiryKind } from "./inquiries";
import { createSubmission, listSubmissions, retryNotifications } from "./submissions";

const consultationsOn = (env: Env) => (env.CONSULTATION_REQUESTS ?? "").toLowerCase() === "on";

async function retryAll(env: Env) {
  const inquiries = await retryNotifications(env, inquiryKind);
  const requests = consultationsOn(env) ? await retryNotifications(env, consultationKind) : { attempted: 0, sent: 0 };
  return { attempted: inquiries.attempted + requests.attempted, sent: inquiries.sent + requests.sent };
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/inquiries") {
      if (request.method === "POST") return createSubmission(request, env, ctx, inquiryKind);
      if (request.method === "GET") return listSubmissions(request, env, inquiryKind);
      return json({ ok: false, error: "method_not_allowed" }, 405, { Allow: "GET, POST" });
    }

    if (pathname === "/api/consultation-requests") {
      if (request.method === "POST") {
        // The demo never accepts patient details: the form there is simulated in the browser.
        if (!consultationsOn(env)) return fail(403, "disabled", "Online consultation requests are not switched on for this site. Please call the clinic.");
        return createSubmission(request, env, ctx, consultationKind);
      }
      if (request.method === "GET") return listSubmissions(request, env, consultationKind);
      return json({ ok: false, error: "method_not_allowed" }, 405, { Allow: "GET, POST" });
    }

    if (pathname === "/api/retry-notifications") {
      if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405, { Allow: "POST" });
      if (!env.ADMIN_TOKEN) return fail(503, "admin_not_configured", "Admin access is not configured (set ADMIN_TOKEN).");
      if (!(await isAdmin(request, env.ADMIN_TOKEN))) return fail(401, "unauthorized", "A valid admin token is required.");
      return json({ ok: true, ...(await retryAll(env)) });
    }

    if (pathname === "/api/health") {
      return json({
        ok: true,
        storage: Boolean(env.DB),
        notifications: emailConfig(env, env.INQUIRY_NOTIFY_TO) !== null,
        consultationRequests: consultationsOn(env) ? { enabled: true, notifications: emailConfig(env, env.CONSULTATION_NOTIFY_TO) !== null } : { enabled: false },
      });
    }

    if (pathname.startsWith("/api/")) return json({ ok: false, error: "not_found" }, 404);

    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(retryAll(env).then(() => undefined));
  },
} satisfies ExportedHandler<Env>;
