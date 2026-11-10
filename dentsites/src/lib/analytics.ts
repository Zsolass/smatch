// Reports booking clicks, calls and successful requests. Events carry only
// where they happened and which treatment they concern: never a name, phone
// number, email address or message.

import { siteConfig } from "@/config/site";

export type AnalyticsEventName = "booking_click" | "call_click" | "consultation_request" | "website_inquiry";

/** The only properties an event may carry. */
export interface AnalyticsProps {
  /** Where on the site it happened, e.g. "header" or "mobile-bar". */
  placement?: string;
  /** Treatment id from src/config/treatments.ts. */
  treatment?: string;
  /** Booking mode: demo, request or link. */
  mode?: string;
}

export interface AnalyticsDetail extends AnalyticsProps {
  event: AnalyticsEventName;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export const ANALYTICS_EVENT = "clinic:analytics";

export function track(event: AnalyticsEventName, props: AnalyticsProps = {}): void {
  if (typeof window === "undefined") return;
  const detail: AnalyticsDetail = { event };
  if (props.placement) detail.placement = props.placement;
  if (props.treatment) detail.treatment = props.treatment;
  if (props.mode) detail.mode = props.mode;
  window.dispatchEvent(new CustomEvent<AnalyticsDetail>(ANALYTICS_EVENT, { detail }));
  if (siteConfig.analytics.enabled) (window.dataLayer ??= []).push(detail);
}
