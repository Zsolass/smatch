import { SectionHeading } from "@/components/ui/SectionHeading";
import { clinic } from "@/config/clinic";
import { TeamCard } from "./TeamCard";

export function Team() {
  const { team } = clinic;
  if (!team.members.length) return null;
  return (
    <section id="team" aria-labelledby="team-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading id="team-title" eyebrow={team.eyebrow} title={team.title} description={team.description} />
        <ul className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {team.members.map((member, i) => (
            <li key={member.id} data-reveal style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}>
              <TeamCard member={member} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
