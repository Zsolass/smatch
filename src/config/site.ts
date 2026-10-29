// The Smatch frame around the demo: everything that is about the website
// service rather than the (fictional) lab. Also imported by the Worker, so keep
// this file free of React and browser APIs.

export const siteConfig = {
  /** Public hostname of this demo. Also stored as the `source` of every inquiry. */
  domain: "labsites.smatch.cloud",
  url: "https://labsites.smatch.cloud",
  /** Keep the fictional lab out of search results. */
  noindex: true,

  demoBanner: {
    text: "Demo laboratory website — customised for your brand.",
    linkLabel: "Get yours",
  },

  smatch: {
    name: "Smatch",
    poweredByLabel: "Powered by Smatch",
    url: "https://smatch.cloud",
  },

  inquiry: {
    endpoint: "/api/inquiries",
    ctaLabel: "Inquire",
    heading: "Inquire",
    subheading: "Tell us about your lab and request a personalised website quote.",
    heroNote: "Run a dental lab? This is a demo website by Smatch. Inquire and we'll build one like it for your lab and brand.",
    submitLabel: "Request a quote",
    successMessage: "Thank you! Your inquiry has been received. We’ll be in touch.",
  },

  privacy: {
    /** Data controller shown on /privacy. */
    controller: "Smatch LLC",
    address: ["30 N Gould St, Ste N", "Sheridan, WY 82801", "United States"],
    /** Optional public privacy contact address; leave null to point people to the reply email instead. */
    contactEmail: null as string | null,
    /** How long inquiries are kept, in months. */
    retentionMonths: 24,
  },
} as const;

export type SiteConfig = typeof siteConfig;
