import type { Metadata } from "next";
import { Suspense } from "react";
import { CaseSubmission } from "@/components/case-submission/CaseSubmission";
import { DemoBanner } from "@/components/site/DemoBanner";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { lab } from "@/config/lab";

export const metadata: Metadata = {
  title: "Send a case (demo)",
  description: `Try sending a digital case to ${lab.name}: practice details, tooth chart, files and review. A demo: nothing leaves your browser.`,
};

export default function SubmitCasePage() {
  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main id="main" className="mx-auto max-w-7xl px-4 pt-10 pb-20 sm:px-6 sm:pt-14 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-accent uppercase">Send a case</p>
          <h1 className="mt-2 text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
            Send your case to <em className="accent-serif">{lab.name}</em>
          </h1>
          <p className="mt-4 text-lg text-ink-soft">Four short steps: your details, the restoration and teeth, your files, then a final review.</p>
        </div>
        <div className="mt-8">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-paper-deep" />}>
            <CaseSubmission />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
