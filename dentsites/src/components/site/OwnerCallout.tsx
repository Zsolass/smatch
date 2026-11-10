import { AccentTitle } from "@/components/ui/AccentTitle";
import { siteConfig } from "@/config/site";
import { InquireLink } from "./InquireLink";

/**
 * The clinic-owner invitation, shown on the patient pages of the demo:
 * "band" is the large closing section, "card" a compact note inside a page.
 */
export function OwnerCallout({ kind = "band" }: { kind?: "band" | "card" }) {
  if (!siteConfig.demo) return null;
  const { demoBanner, smatch } = siteConfig;
  if (kind === "card") {
    return (
      <aside aria-label="For clinic owners" className="flex flex-col gap-4 rounded-2xl border border-coral/40 bg-coral/10 p-4 sm:flex-row sm:items-center sm:p-5">
        <p className="text-[0.9375rem] leading-relaxed text-ink">
          <span className="font-semibold">For clinic owners · </span>
          This is a demo website by {smatch.name}. Inquire and we’ll build one like it for your clinic and brand.
        </p>
        <InquireLink className="shrink-0 self-start sm:self-auto" arrow />
      </aside>
    );
  }
  return (
    <section aria-labelledby="owner-callout-title" className="relative overflow-hidden bg-pop py-16 text-night sm:py-20">
      <div aria-hidden="true" className="absolute -top-24 -right-16 size-80 rounded-full bg-coral/60 blur-2xl" />
      <div aria-hidden="true" className="absolute -bottom-32 left-1/3 size-80 rounded-full bg-white/50 blur-2xl" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-3xl" data-reveal>
          <p className="inline-flex items-center gap-2 rounded-full bg-night px-3.5 py-1.5 text-xs font-semibold tracking-[0.12em] text-white uppercase">
            <span className="size-1.5 rounded-full bg-pop" aria-hidden="true" />
            For clinic owners · from {smatch.name}
          </p>
          <h2 id="owner-callout-title" className="mt-5 font-display text-[2.25rem] leading-[1.05] font-[380] tracking-[-0.022em] text-balance sm:text-6xl [&_em]:font-[360] [&_em]:italic">
            <AccentTitle text={demoBanner.calloutTitle} />
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-night/80">{demoBanner.calloutText}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3" data-reveal>
          <InquireLink size="lg" arrow className="bg-night text-white shadow-none hover:brightness-125">
            {demoBanner.linkLabel}
          </InquireLink>
        </div>
      </div>
    </section>
  );
}
