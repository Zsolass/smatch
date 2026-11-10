// How a consultation request leaves the form. The demo adapter keeps
// everything in the browser; the HTTP adapter posts to the Worker and reports
// success only after the Worker acknowledges that the request is stored.

import type { ConsultationErrors, ConsultationInput } from "./schema";

export interface SubmissionMeta {
  /** One key per form fill: a retried request must not create a second record. */
  idempotencyKey: string;
  /** Hidden field that people never see; bots that fill it are rejected. */
  hp: string;
  /** Time since the form appeared, in ms. */
  elapsedMs: number;
}

export type SubmissionResult =
  | { ok: true; reference: string }
  | { ok: false; message: string; fieldErrors?: ConsultationErrors };

export interface ConsultationAdapter {
  /** "demo" labels the form as a demonstration and changes the confirmation wording. */
  kind: "demo" | "live";
  submit(input: ConsultationInput, meta: SubmissionMeta): Promise<SubmissionResult>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Demo: validates nothing further and sends nothing. The reference is made up locally. */
export function createDemoAdapter(delayMs = 900): ConsultationAdapter {
  const references = new Map<string, string>();
  return {
    kind: "demo",
    async submit(_input, meta) {
      await sleep(delayMs);
      // Behaves like a real request would when the connection drops.
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return { ok: false, message: "We couldn't reach the server. Check your connection and try again; your details are still here." };
      }
      let reference = references.get(meta.idempotencyKey);
      if (!reference) {
        reference = `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        references.set(meta.idempotencyKey, reference);
      }
      return { ok: true, reference };
    },
  };
}

/** Live: posts the request to the Worker endpoint. */
export function createHttpAdapter(endpoint: string, fetcher: typeof fetch = (...args) => fetch(...args)): ConsultationAdapter {
  return {
    kind: "live",
    async submit(input, meta) {
      let response: Response;
      try {
        response = await fetcher(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ...input, ...meta }),
        });
      } catch {
        return { ok: false, message: "We couldn't reach the server. Check your connection and try again; your details are still here." };
      }

      const isJson = (response.headers.get("Content-Type") ?? "").includes("application/json");
      const data = isJson ? ((await response.json().catch(() => null)) as Record<string, unknown> | null) : null;

      // Success only when the server confirms it stored the request.
      if (response.ok && data?.ok === true && typeof data.reference === "string") return { ok: true, reference: data.reference };

      if (!data) {
        return { ok: false, message: "Online requests aren't available right now, so your request was not sent. Please call us instead; your details are still in the form." };
      }
      const fieldErrors = data.error === "validation" && data.fieldErrors && typeof data.fieldErrors === "object" ? (data.fieldErrors as ConsultationErrors) : undefined;
      const message = typeof data.message === "string" ? data.message : "Something went wrong. Please try again, or call us.";
      return { ok: false, message, fieldErrors };
    },
  };
}
