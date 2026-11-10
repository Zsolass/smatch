import type { ReactNode } from "react";

// Line icons on a 24px grid. Decorative: always paired with visible text.
const paths: Record<string, ReactNode> = {
  // patient needs
  tooth: <path d="M7.5 3.5c-2.4 0-4 1.9-4 4.4 0 2.2.8 3.4 1.2 5.4.5 2.3.6 7.2 2.3 7.2 1.5 0 1.6-3 2.1-4.9.3-1 .8-1.5 1.4-1.5s1.1.5 1.4 1.5c.5 1.9.6 4.9 2.1 4.9 1.7 0 1.8-4.9 2.3-7.2.4-2 1.2-3.2 1.2-5.4 0-2.5-1.6-4.4-4-4.4-1.2 0-2 .5-3 1.1-1-.6-1.8-1.1-3-1.1Z" />,
  arch: <path d="M4 19v-6.5a8 8 0 0 1 16 0V19M8 19v-6a4 4 0 0 1 8 0v6M4 19h4m8 0h4" />,
  sparkle: <path d="M12 3.5l1.7 4.8 4.8 1.7-4.8 1.7-1.7 4.8-1.7-4.8L5.5 10l4.8-1.7L12 3.5ZM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />,
  align: <path d="M4 7h16M4 12h16M4 17h16M8 4.5v5M16 9.5v5M11 14.5v5" />,
  urgent: <path d="M12 3.5l9 16H3l9-16Zm0 6.5v4.5m0 2.7v.1" />,
  care: <path d="M12 20s-7.5-4.3-7.5-9.7A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7C19.5 15.7 12 20 12 20Z" />,
  // general
  phone: <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />,
  pin: <path d="M12 21s-6.5-5.6-6.5-10.7a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Zm0-8.2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13.5V12l3 2" />,
  car: <path d="M5 16.5v2m14-2v2M4 16.5h16v-4l-1.8-5a1.5 1.5 0 0 0-1.4-1H7.2a1.5 1.5 0 0 0-1.4 1L4 12.5v4Zm0-4h16M7.5 14.4v.1m9-.1v.1" />,
  mail: <path d="M4 6.5h16v11H4v-11Zm0 .5 8 6 8-6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  calendar: <path d="M5 6.5h14v13H5v-13Zm0 4h14M8.5 4v4m7-4v4" />,
  scan: <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8m8 0h2.5A1.5 1.5 0 0 1 20 5.5V8m0 8v2.5a1.5 1.5 0 0 1-1.5 1.5H16m-8 0H5.5A1.5 1.5 0 0 1 4 18.5V16m3-4h10" />,
  document: <path d="M7 3.5h7l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Zm7 0V8h4M9 12h6m-6 3.5h6" />,
  person: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5 8.5c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5" />,
  quote: <path d="M9.5 7C6.5 8 5 10.2 5 13.2V17h5v-5H7.5c0-1.5.8-2.6 2.5-3.2L9.5 7Zm9 0c-3 1-4.5 3.2-4.5 6.2V17h5v-5h-2.5c0-1.5.8-2.6 2.5-3.2L18.5 7Z" />,
  star: <path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3.8Z" />,
  play: <path d="M8.5 5.5v13l10-6.5-10-6.5Z" />,
};

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function CheckBullet({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span className={`mt-1 grid size-5 shrink-0 place-items-center rounded-full ${tone === "dark" ? "bg-sage/25 text-sage" : "bg-accent-soft text-accent"}`}>
      <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
