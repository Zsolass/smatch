"use client";

import { useEffect, useState } from "react";
import { BookingLink, CallLink } from "./BookingLink";

/**
 * Call and book, always within reach on small screens. The bar steps aside
 * while a consultation form is on screen, so it never covers the form or its
 * submit button; pages reserve its height at the bottom (see PageShell).
 */
export function MobileActionBar({ treatment }: { treatment?: string }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const forms = Array.from(document.querySelectorAll("[data-consultation-form]"));
    if (!forms.length || !("IntersectionObserver" in window)) return;
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        setHidden(visible.size > 0);
      },
      { threshold: 0.02 },
    );
    forms.forEach((f) => observer.observe(f));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      data-action-bar
      // Hidden from keyboard and assistive tech while off screen.
      inert={hidden}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_-20px_rgb(28_34_30/0.5)] backdrop-blur-md transition-transform duration-300 lg:hidden ${
        hidden ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex max-w-xl gap-2.5">
        <CallLink placement="mobile-bar" label="call" className="flex-1 px-3" />
        <BookingLink placement="mobile-bar" treatment={treatment} className="flex-[1.6] px-3" />
      </div>
    </div>
  );
}
