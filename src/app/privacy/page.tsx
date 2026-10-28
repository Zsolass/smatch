import type { Metadata } from "next";
import Link from "next/link";
import { DemoBanner } from "@/components/site/DemoBanner";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { lab } from "@/config/lab";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: `How ${siteConfig.smatch.name} handles website quote inquiries sent from this demo.`,
};

export default function PrivacyPage() {
  const { privacy, smatch } = siteConfig;
  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-sm font-semibold tracking-wide text-accent uppercase">Privacy</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Privacy notice</h1>
        <div className="mt-8 grid gap-8 text-[1.0625rem] leading-relaxed text-ink-soft [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink">
          <section>
            <h2>What this covers</h2>
            <p>
              This notice explains how {privacy.controller} handles the details you send through the <strong className="text-ink">Inquire</strong> form on{" "}
              {siteConfig.domain}, where dental lab owners can request a quote for their own website.
            </p>
          </section>
          <section>
            <h2>What we collect</h2>
            <p>
              The details you enter: laboratory name, company name (optional), contact person, work email, phone number, country, state or region, city,
              current website (optional) and your message. We also record when the inquiry was received and that it came from this site.
            </p>
          </section>
          <section>
            <h2>Why we use it</h2>
            <p>
              Only to reply to your inquiry and prepare a personalised quote. We don&apos;t sell your details or use them for unrelated marketing. A
              notification with your inquiry is emailed to the {smatch.name} team.
            </p>
          </section>
          <section>
            <h2>How long we keep it</h2>
            <p>
              Inquiries are kept for up to {privacy.retentionMonths} months, or for as long as needed if we go on to work together, and are then deleted.
            </p>
          </section>
          <section>
            <h2>Your choices</h2>
            <p>
              You can ask us to show, correct or delete your details at any time
              {privacy.contactEmail ? (
                <>
                  {" "}
                  by emailing{" "}
                  <a className="font-medium text-accent underline underline-offset-2" href={`mailto:${privacy.contactEmail}`}>
                    {privacy.contactEmail}
                  </a>
                </>
              ) : (
                " by replying to any email we send you about your inquiry"
              )}
              .
            </p>
          </section>
          <section>
            <h2>The case submission demo</h2>
            <p>
              The &ldquo;Send a case&rdquo; form on this site is a demo. Everything you enter and the files you add stay in your browser and are
              cleared when you reload the page; nothing is sent to {lab.name}, which is a fictional laboratory, or to anyone else.
            </p>
          </section>
          <p>
            <Link href="/#inquire" className="font-medium text-accent underline underline-offset-2">
              Back to the inquiry form
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
