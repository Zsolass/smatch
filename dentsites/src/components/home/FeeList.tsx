import Link from "next/link";
import type { Fee } from "@/config/clinic";
import { findTreatment } from "@/config/treatments";
import { formatFee } from "@/lib/format";

/** Fee rows: what the fee is for, what it includes and its unit, with staged fees broken down. */
export function FeeList({ fees, linkTreatments = false }: { fees: Fee[]; linkTreatments?: boolean }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {fees.map((fee) => {
        const treatment = linkTreatments && fee.treatment ? findTreatment(fee.treatment) : undefined;
        return (
          <li key={fee.id} className="py-5">
            <div className="flex flex-col gap-x-8 gap-y-1 sm:flex-row sm:items-baseline sm:justify-between">
              <div className="min-w-0">
                <h4 className="font-semibold text-ink">
                  {treatment ? (
                    <Link href={`/treatments/${treatment.id}`} className="underline decoration-accent/30 underline-offset-4 hover:decoration-accent">
                      {fee.label}
                    </Link>
                  ) : (
                    fee.label
                  )}
                </h4>
                <p className="mt-1 text-[0.9375rem] text-ink-soft">{fee.includes}</p>
              </div>
              <p className="shrink-0 sm:text-right">
                <span className="display text-2xl text-ink">{formatFee(fee)}</span> <span className="text-sm whitespace-nowrap text-ink-soft">{fee.unit}</span>
              </p>
            </div>
            {fee.stages && fee.stages.length > 0 && (
              <ol className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
                {fee.stages.map((stage, i) => (
                  <li key={stage.label} className="bg-surface p-4">
                    <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">
                      Stage {i + 1} · {stage.stage}
                    </p>
                    <p className="mt-2 font-semibold text-ink">{stage.label}</p>
                    <p className="mt-0.5 text-[0.9375rem] text-ink">
                      {formatFee(stage)} <span className="text-sm text-ink-soft">{fee.unit}</span>
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{stage.includes}</p>
                  </li>
                ))}
              </ol>
            )}
            {fee.stages && fee.stagesNote && <p className="mt-3 text-sm text-ink-soft">{fee.stagesNote}</p>}
          </li>
        );
      })}
    </ul>
  );
}
