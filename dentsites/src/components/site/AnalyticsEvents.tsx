"use client";

import { useEffect } from "react";
import { track, type AnalyticsEventName } from "@/lib/analytics";

const CLICK_EVENTS: AnalyticsEventName[] = ["booking_click", "call_click"];

/** Reports clicks on elements marked with data-analytics (booking buttons and call links). */
export function AnalyticsEvents() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-analytics]");
      const event = el?.dataset.analytics as AnalyticsEventName | undefined;
      if (!el || !event || !CLICK_EVENTS.includes(event)) return;
      track(event, { placement: el.dataset.placement, treatment: el.dataset.treatment });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
