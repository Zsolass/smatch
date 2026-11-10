import Link from "next/link";
import { siteConfig } from "@/config/site";

/** The clinic-owner route into the demo. Hidden on a real clinic's site. */
export function DemoBanner() {
  if (!siteConfig.demo) return null;
  return (
    <div className="bg-pop text-night">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-4 py-2.5 text-center text-[0.9375rem] sm:px-6">
        <p className="font-medium">
          <span className="sr-only">Notice: </span>
          {siteConfig.demoBanner.text}
        </p>
        <Link href={siteConfig.inquiry.path} className="inline-flex h-9 items-center rounded-full bg-night px-4 text-sm font-semibold whitespace-nowrap text-white transition-transform hover:-translate-y-0.5">
          {siteConfig.demoBanner.linkLabel} →
        </Link>
      </div>
    </div>
  );
}
