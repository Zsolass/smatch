// Deployment settings and the Smatch frame around the demo: booking
// integration, form mode, demo/production switches and the website-quote
// inquiry for clinic owners. Also imported by the Worker, so keep this file
// free of React and browser APIs.

/**
 * How "Book a consultation" works:
 * - "demo":    the request form is simulated in the browser; nothing is sent.
 * - "request": the form posts to the Worker (`booking.endpoint`), which stores
 *              the request and emails the clinic. Also needs the Worker variable
 *              CONSULTATION_REQUESTS=on (see README).
 * - "link":    every booking button opens `booking.bookingUrl`, the clinic's own
 *              online booking system.
 */
export type BookingMode = "demo" | "request" | "link";

export const siteConfig = {
  /** Public hostname of this site. Also stored as the `source` of every inquiry. */
  domain: "dentsites.smatch.cloud",
  url: "https://dentsites.smatch.cloud",

  /**
   * true for the fictional demo: sample content is labelled, the Smatch banner
   * and the clinic-owner page are shown. Set to false for a real clinic.
   */
  demo: true,
  /** Keep the fictional clinic out of search results. Production indexing is an explicit choice: set this to false AND remove the X-Robots-Tag line in public/_headers. */
  noindex: true,
  /** JSON-LD business details. Enable only with real, verified clinic details. */
  structuredData: false,

  locale: "en-US",
  currency: "USD",

  booking: {
    mode: "demo" as BookingMode,
    ctaLabel: "Book a consultation",
    /** Page that holds the request form. */
    path: "/book",
    /** The clinic's online booking system, for mode "link". */
    bookingUrl: null as string | null,
    /** Worker endpoint for mode "request". */
    endpoint: "/api/consultation-requests",
  },

  /**
   * Booking clicks, calls and successful requests are reported as events
   * without personal details. With `enabled`, they are pushed to
   * `window.dataLayer` (Google Tag Manager and compatible tools).
   */
  analytics: { enabled: false },

  demoBanner: {
    text: "Demo clinic website by Smatch, with sample content.",
    linkLabel: "Get a website like this",
  },

  smatch: {
    name: "Smatch",
    poweredByLabel: "Website by Smatch",
    url: "https://smatch.cloud",
  },

  /** The clinic-owner journey: a website quote request that goes to Smatch. */
  inquiry: {
    path: "/get-this-website",
    endpoint: "/api/inquiries",
    ctaLabel: "Inquire",
    heading: "Get a website like this for your clinic",
    subheading: "Tell us about your clinic and request a personalised website quote.",
    submitLabel: "Request a quote",
    successMessage: "Thank you! Your inquiry has been received. We’ll be in touch.",
  },

  privacy: {
    /** Data controller for website inquiries, shown on /privacy. */
    controller: "Smatch LLC",
    address: ["30 N Gould St, Ste N", "Sheridan, WY 82801", "United States"],
    /** Public privacy contact address; null points people to the reply email instead. */
    contactEmail: "office@smatch.cloud" as string | null,
    /** How long inquiries are kept, in months. */
    retentionMonths: 24,
  },
} as const;

export type SiteConfig = typeof siteConfig;
