import type { ReactNode } from "react";
import { AccentTitle } from "./AccentTitle";

interface Props {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  id?: string;
  /** Heading level; sections on a page use h2. */
  as?: "h1" | "h2";
}

export function SectionHeading({ eyebrow, title, description, align = "left", tone = "light", id, as: Tag = "h2" }: Props) {
  const dark = tone === "dark";
  return (
    <div className={`max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`} data-reveal>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <Tag id={id} className={`display text-[2.25rem] text-balance sm:text-5xl lg:text-[3.5rem] ${dark ? "text-white" : "text-ink"}`}>
        <AccentTitle text={title} />
      </Tag>
      {description && <div className={`mt-5 max-w-2xl text-lg text-pretty ${dark ? "text-white/75" : "text-ink-soft"}`}>{description}</div>}
    </div>
  );
}
