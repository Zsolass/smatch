import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { CSSProperties } from "react";
import { AnalyticsEvents } from "@/components/site/AnalyticsEvents";
import { RevealObserver } from "@/components/ui/RevealObserver";
import { clinic } from "@/config/clinic";
import { siteConfig } from "@/config/site";
import "./globals.css";

// Typography: one expressive heading font and a highly readable body font.
// To change them, point these two declarations at other font files.
const body = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-italic.woff2", style: "italic" },
  ],
  variable: "--font-body",
  weight: "300 900",
  display: "swap",
});

const heading = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-italic.woff2", style: "italic" },
  ],
  variable: "--font-heading",
  weight: "100 900",
  display: "swap",
});

const noindex = { index: false, follow: false, googleBot: { index: false, follow: false } };

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: clinic.seo.title, template: `%s · ${clinic.name}` },
  description: clinic.seo.description,
  robots: siteConfig.noindex ? noindex : undefined,
  openGraph: {
    type: "website",
    title: clinic.seo.title,
    description: clinic.seo.description,
    url: siteConfig.url,
    siteName: clinic.name,
    images: [{ url: clinic.seo.ogImage, width: 1200, height: 630, alt: `${clinic.name} website` }],
  },
  twitter: { card: "summary_large_image", title: clinic.seo.title, description: clinic.seo.description, images: [clinic.seo.ogImage] },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: clinic.colors.paper,
  width: "device-width",
  initialScale: 1,
};

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const brandVars = Object.fromEntries(Object.entries(clinic.colors).map(([k, v]) => [`--clinic-${kebab(k)}`, v])) as CSSProperties;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable}`} style={brandVars} suppressHydrationWarning>
      <head>
        {/* Enables reveal animations only when JS runs, so content never stays hidden. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh overflow-x-clip">
        {children}
        <RevealObserver />
        <AnalyticsEvents />
      </body>
    </html>
  );
}
