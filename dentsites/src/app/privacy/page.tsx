import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { clinic } from "@/config/clinic";
import { siteConfig } from "@/config/site";
import { bookingMode } from "@/lib/booking";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: `How details entered on ${siteConfig.domain} are handled: the consultation request and the website inquiry.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const { privacy, smatch } = siteConfig;
  const mode = bookingMode();
  const link = "font-semibold text-accent underline underline-offset-2";
  return (
    <PageShell mainClassName="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="eyebrow">Privacy</p>
      <h1 className="display mt-5 text-[2.625rem] text-ink sm:text-6xl">Privacy notice</h1>
      <div className="mt-10 grid gap-9 text-ink-soft [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink">
        <section>
          <h2>What this covers</h2>
          <p>
            This website has two forms. Patients use the <strong className="text-ink">consultation request</strong>.{" "}
            {siteConfig.demo && (
              <>
                Clinic owners can use the <strong className="text-ink">{siteConfig.inquiry.ctaLabel}</strong> form to ask {smatch.name} for a website of their own. This
                notice explains what happens to the details entered in each.
              </>
            )}
          </p>
        </section>

        <section>
          <h2>The consultation request</h2>
          {mode === "demo" ? (
            <p>
              {clinic.name} is a fictional clinic and its consultation form is a demonstration. What you type is checked in your browser and is{" "}
              <strong className="text-ink">not sent, stored or shared</strong>; it is cleared when you leave or reload the page, and no appointment is booked. Please use
              made-up details.
            </p>
          ) : mode === "link" ? (
            <p>Consultations are booked in the clinic’s online booking system, which opens in a new tab and has its own privacy notice. This website does not receive the details you enter there.</p>
          ) : (
            <p>
              When you send a consultation request, {clinic.name} receives your name, phone number, email address if given, the treatment you are interested in, your
              preferred way of being contacted and your message. The clinic uses them only to contact you and arrange your consultation. Please do not include medical
              details you would rather discuss in person.
            </p>
          )}
        </section>

        {siteConfig.demo && (
          <>
            <section>
              <h2>The website inquiry: who we are</h2>
              <p>
                Inquiries sent from{" "}
                <Link href={siteConfig.inquiry.path} className={link}>
                  the page for clinic owners
                </Link>{" "}
                go to {privacy.controller}, the data controller:
              </p>
              <address className="mt-3 text-ink not-italic">
                <span className="block font-semibold">{privacy.controller}</span>
                {privacy.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </section>
            <section>
              <h2>What we collect</h2>
              <p>
                The details you enter: clinic name, company name (optional), contact person, work email, phone number, country, state or region, city, current website
                (optional) and your message. We also record when the inquiry was received and that it came from this site.
              </p>
            </section>
            <section>
              <h2>Why we use it</h2>
              <p>
                Only to reply to your inquiry and prepare a personalised quote. We don’t sell your details or use them for unrelated marketing. A notification with your
                inquiry is emailed to the {smatch.name} team.
              </p>
            </section>
            <section>
              <h2>How long we keep it</h2>
              <p>Inquiries are kept for up to {privacy.retentionMonths} months, or for as long as needed if we go on to work together, and are then deleted.</p>
            </section>
            <section>
              <h2>Your choices</h2>
              <p>
                You can ask us to show, correct or delete your details at any time
                {privacy.contactEmail ? (
                  <>
                    {" "}
                    by emailing{" "}
                    <a className={link} href={`mailto:${privacy.contactEmail}`}>
                      {privacy.contactEmail}
                    </a>
                  </>
                ) : (
                  " by replying to any email we send you about your inquiry"
                )}
                .
              </p>
            </section>
          </>
        )}

        <section>
          <h2>Measurement</h2>
          <p>
            {siteConfig.analytics.enabled
              ? "We count how often the booking and call buttons are used and how many requests are completed. These counts never include your name, phone number, email address or message."
              : "This site uses no analytics or advertising cookies."}
          </p>
        </section>

        <p>
          <Link href="/" className={link}>
            Back to the homepage
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
