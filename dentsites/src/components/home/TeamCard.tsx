import { SampleTag } from "@/components/ui/SampleTag";
import type { TeamMember } from "@/config/clinic";
import { siteConfig } from "@/config/site";

const initials = (name: string) =>
  name
    .replace(/^Dr\.\s*/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function TeamCard({ member, compact = false }: { member: TeamMember; compact?: boolean }) {
  return (
    <article className="flex h-full flex-col">
      <div className="flex items-center gap-5 sm:block">
        <div className={`arch relative h-32 w-28 shrink-0 overflow-hidden bg-gradient-to-b from-accent-soft to-sage/45 sm:h-auto sm:w-full ${compact ? "sm:aspect-[5/4]" : "sm:aspect-[4/5]"}`}>
          {member.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- portraits come from config
            <img src={member.photo} alt={`Portrait of ${member.name}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-display text-4xl text-accent/55 sm:text-6xl" aria-hidden="true">
                {initials(member.name)}
              </span>
              {siteConfig.demo && <span className="absolute bottom-4 hidden rounded-full bg-surface/85 px-3 py-1 text-xs font-medium text-ink-soft sm:block">Portrait goes here</span>}
            </div>
          )}
        </div>
        <div className="min-w-0 sm:mt-5">
          <h3 className="display text-2xl text-ink">
            {member.name}
            {member.credentials && <span className="font-sans text-base font-medium tracking-normal text-ink-soft">, {member.credentials}</span>}
          </h3>
          <p className="mt-1.5 text-[0.9375rem] font-semibold text-accent">
            {member.role} · <span className="font-normal text-ink-soft">{member.focus}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{member.bio}</p>
        {member.qualifications.length > 0 && (
          <ul className="mt-4 grid gap-1.5 border-t border-line pt-4 text-sm text-ink-soft">
            {member.qualifications.map((q) => (
              <li key={q} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                {q}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <SampleTag>Sample profile</SampleTag>
        </div>
      </div>
    </article>
  );
}
