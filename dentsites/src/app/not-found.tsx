import { BookingLink } from "@/components/site/BookingLink";
import { PageShell } from "@/components/site/PageShell";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <PageShell mainClassName="mx-auto grid min-h-[50vh] max-w-xl place-content-center px-4 py-24 text-center">
      <p className="display text-7xl text-accent italic">404</p>
      <h1 className="display mt-4 text-4xl text-ink">This page doesn’t exist</h1>
      <p className="mt-3 text-ink-soft">The link may be broken, or the page may have moved.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Back to the homepage</ButtonLink>
        <BookingLink placement="not-found" variant="secondary" />
      </div>
    </PageShell>
  );
}
