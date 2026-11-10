import type { ReactNode } from "react";
import { DemoBanner } from "./DemoBanner";
import { MobileActionBar } from "./MobileActionBar";
import { OwnerCallout } from "./OwnerCallout";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { StructuredData } from "./StructuredData";

interface Props {
  children: ReactNode;
  mainClassName?: string;
  /** Preselects this treatment when the mobile bar's booking button is used. */
  treatment?: string;
  /** Pages for clinic owners don't show the patient call/book bar. */
  actionBar?: boolean;
}

/** Banner, header, main content, footer and the mobile call/book bar. */
export function PageShell({ children, mainClassName = "", treatment, actionBar = true }: Props) {
  return (
    <>
      <a href="#main" className="sr-only z-50 rounded-lg bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <DemoBanner />
      <SiteHeader actionBar={actionBar} />
      <main id="main" className={mainClassName}>
        {children}
      </main>
      {actionBar && <OwnerCallout />}
      <SiteFooter />
      {actionBar && (
        <>
          {/* Reserves the bar's height so it never covers the end of the page. */}
          <div aria-hidden="true" className="h-[calc(var(--action-bar-height)+env(safe-area-inset-bottom))] bg-night lg:hidden" />
          <MobileActionBar treatment={treatment} />
        </>
      )}
      <StructuredData />
    </>
  );
}
