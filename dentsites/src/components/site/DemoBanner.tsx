import Link from "next/link";
import { siteConfig } from "@/config/site";

/** The clinic-owner route into the demo. Hidden on a real clinic's site. */
export function DemoBanner() {
  if (!siteConfig.demo) return null;
  return (
    <div className="on-dark bg-night text-white/75">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2 text-center text-[0.8125rem] sm:px-6">
        <p>
          <span className="sr-only">Notice: </span>
          {siteConfig.demoBanner.text}{" "}
          <Link href={siteConfig.inquiry.path} className="font-semibold whitespace-nowrap text-white underline decoration-white/35 underline-offset-4 hover:decoration-white">
            {siteConfig.demoBanner.linkLabel} →
          </Link>
        </p>
      </div>
    </div>
  );
}
