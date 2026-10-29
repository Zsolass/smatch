import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { CSSProperties } from "react";
import { RevealObserver } from "@/components/ui/RevealObserver";
import { lab } from "@/config/lab";
import { siteConfig } from "@/config/site";
import "./globals.css";

const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const instrument = localFont({
  src: [
    { path: "../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2", style: "normal" },
    { path: "../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2", style: "italic" },
  ],
  variable: "--font-instrument",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: lab.seo.title, template: `%s · ${lab.name}` },
  description: lab.seo.description,
  robots: siteConfig.noindex ? { index: false, follow: false, googleBot: { index: false, follow: false } } : undefined,
  openGraph: {
    type: "website",
    title: lab.seo.title,
    description: lab.seo.description,
    url: siteConfig.url,
    siteName: lab.name,
    images: [{ url: lab.seo.ogImage, width: 1200, height: 630, alt: `${lab.name} demo website` }],
  },
  twitter: { card: "summary_large_image", title: lab.seo.title, description: lab.seo.description, images: [lab.seo.ogImage] },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: lab.colors.paper,
  width: "device-width",
  initialScale: 1,
};

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const brandVars = Object.fromEntries(Object.entries(lab.colors).map(([k, v]) => [`--lab-${kebab(k)}`, v])) as CSSProperties;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${instrument.variable}`} style={brandVars} suppressHydrationWarning>
      <head>
        {/* Enables reveal animations only when JS runs, so content never stays hidden. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh overflow-x-clip">
        {children}
        <RevealObserver />
      </body>
    </html>
  );
}
