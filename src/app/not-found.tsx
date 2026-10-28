import { ButtonLink } from "@/components/ui/Button";
import { DemoBanner } from "@/components/site/DemoBanner";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function NotFound() {
  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main id="main" className="mx-auto grid min-h-[50vh] max-w-xl place-content-center px-4 py-24 text-center">
        <p className="font-serif text-6xl text-accent italic">404</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">This page doesn&apos;t exist</h1>
        <p className="mt-3 text-ink-soft">The link may be broken, or the page may have moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/">Back to the homepage</ButtonLink>
          <ButtonLink href="/submit-case" variant="secondary">
            Send a case
          </ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
