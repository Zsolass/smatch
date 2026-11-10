// Resolves where "Book a consultation" leads. Browser/build only: the Worker
// must not import this file (it reads process.env).
import { siteConfig, type BookingMode } from "@/config/site";

/** The booking mode, with a build-time override for trying the live form locally. */
export function bookingMode(): BookingMode {
  const override = process.env.NEXT_PUBLIC_BOOKING_MODE;
  if (override === "demo" || override === "request" || override === "link") return override;
  return siteConfig.booking.mode;
}

/** True when booking buttons leave the site for the clinic's booking system. */
export function usesBookingLink(): boolean {
  return bookingMode() === "link" && Boolean(siteConfig.booking.bookingUrl);
}

/** Link target for a booking button, keeping the treatment the visitor was reading about. */
export function bookingHref(treatmentId?: string): string {
  if (usesBookingLink()) return siteConfig.booking.bookingUrl!;
  return treatmentId ? `${siteConfig.booking.path}?treatment=${encodeURIComponent(treatmentId)}` : siteConfig.booking.path;
}
