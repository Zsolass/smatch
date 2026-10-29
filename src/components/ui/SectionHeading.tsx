import type { ReactNode } from "react";
import { AccentTitle } from "./AccentTitle";

interface Props {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  id?: string;
}

export function SectionHeading({ eyebrow, title, description, align = "left", tone = "light", id }: Props) {
  const dark = tone === "dark";
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`} data-reveal>
      {eyebrow && (
        <p className={`mb-3 text-sm font-semibold tracking-wide uppercase ${dark ? "text-highlight" : "text-accent"}`}>{eyebrow}</p>
      )}
      <h2 id={id} className={`text-[2rem] leading-[1.08] font-semibold tracking-tight text-balance sm:text-[2.6rem] ${dark ? "text-white" : "text-ink"}`}>
        <AccentTitle text={title} />
      </h2>
      {description && <div className={`mt-4 text-lg text-pretty ${dark ? "text-white/70" : "text-ink-soft"}`}>{description}</div>}
    </div>
  );
}
