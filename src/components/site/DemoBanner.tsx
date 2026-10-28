import Link from "next/link";
import { siteConfig } from "@/config/site";

export function DemoBanner() {
  return (
    <div className="on-dark bg-night text-white/80">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-[0.8125rem] sm:px-6">
        <span className="hidden size-1.5 shrink-0 rounded-full bg-highlight sm:inline-block" aria-hidden="true" />
        <p>
          <span className="sr-only">Notice: </span>
          {siteConfig.demoBanner.text}{" "}
          <Link href="/#inquire" className="font-medium whitespace-nowrap text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
            {siteConfig.demoBanner.linkLabel} →
          </Link>
        </p>
      </div>
    </div>
  );
}
