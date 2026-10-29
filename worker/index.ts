// Worker entry: serves the static export and the /api/* routes.
import type { Env } from "./env";
import { createInquiry, json, listInquiriesHandler, retryNotifications, retryNotificationsHandler } from "./inquiries";
import { notifyConfig } from "./notify";

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/inquiries") {
      if (request.method === "POST") return createInquiry(request, env, ctx);
      if (request.method === "GET") return listInquiriesHandler(request, env);
      return json({ ok: false, error: "method_not_allowed" }, 405, { Allow: "GET, POST" });
    }

    if (pathname === "/api/inquiries/retry-notifications") {
      if (request.method === "POST") return retryNotificationsHandler(request, env);
      return json({ ok: false, error: "method_not_allowed" }, 405, { Allow: "POST" });
    }

    if (pathname === "/api/health") {
      return json({ ok: true, storage: Boolean(env.DB), notifications: notifyConfig(env) !== null });
    }

    if (pathname.startsWith("/api/")) return json({ ok: false, error: "not_found" }, 404);

    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(retryNotifications(env).then(() => undefined));
  },
} satisfies ExportedHandler<Env>;
