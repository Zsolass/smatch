import Link from "next/link";
import type { ReactNode } from "react";
import { Arrow, buttonClass, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { mainLocation } from "@/config/clinic";
import { siteConfig } from "@/config/site";
import { bookingHref, usesBookingLink } from "@/lib/booking";

interface BookingProps {
  /** Treatment id to preselect in the consultation form. */
  treatment?: string;
  /** Where the button sits, for analytics (no personal data). */
  placement: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  arrow?: boolean;
  children?: ReactNode;
  onClick?: () => void;
}

/**
 * The one booking call to action. It opens the consultation form (keeping the
 * treatment the visitor was reading about) or, in "link" mode, the clinic's
 * online booking system.
 */
export function BookingLink({ treatment, placement, variant = "primary", size = "md", className = "", arrow = false, children, onClick }: BookingProps) {
  const external = usesBookingLink();
  const props = {
    href: bookingHref(treatment),
    className: buttonClass(variant, size, className),
    "data-analytics": "booking_click",
    "data-placement": placement,
    "data-treatment": treatment,
    onClick,
  };
  const label = (
    <>
      {children ?? siteConfig.booking.ctaLabel}
      {arrow && <Arrow />}
    </>
  );
  return external ? (
    <a {...props} target="_blank" rel="noopener">
      {label}
      <span className="sr-only"> (opens the booking system in a new tab)</span>
    </a>
  ) : (
    <Link {...props}>{label}</Link>
  );
}

interface CallProps {
  placement: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** "number" shows the phone number; "call" shows "Call us". */
  label?: "number" | "call";
  phone?: string;
  phoneHref?: string;
}

/** A call link using the clinic's configured phone number. */
export function CallLink({ placement, variant = "secondary", size = "md", className = "", label = "number", phone = mainLocation.phone, phoneHref = mainLocation.phoneHref }: CallProps) {
  return (
    <a href={phoneHref} className={buttonClass(variant, size, className)} data-analytics="call_click" data-placement={placement} aria-label={`Call ${phone}`}>
      <Icon name="phone" className="size-[1.125rem]" />
      {label === "number" ? phone : "Call us"}
    </a>
  );
}
