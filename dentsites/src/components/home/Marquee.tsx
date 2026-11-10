import { clinic } from "@/config/clinic";
import { enabledTreatments } from "@/config/treatments";

/** A slow ribbon of what the clinic offers. Decorative: the same links exist in the menu and below. */
export function Marquee() {
  const items = [...enabledTreatments.map((t) => t.name), ...clinic.hero.points];
  if (!items.length) return null;
  const row = (
    <ul className="flex shrink-0 items-center gap-8 pr-8">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-8 font-display text-2xl whitespace-nowrap italic sm:text-3xl">
          {item}
          <svg viewBox="0 0 24 24" className="size-5 text-pop" fill="currentColor">
            <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z" />
          </svg>
        </li>
      ))}
    </ul>
  );
  return (
    <div aria-hidden="true" className="overflow-hidden bg-accent py-4 text-white">
      <div className="flex w-max animate-marquee">
        {row}
        {row}
      </div>
    </div>
  );
}
