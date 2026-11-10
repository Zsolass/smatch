import { Icon } from "@/components/ui/Icon";
import { SampleTag } from "@/components/ui/SampleTag";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { clinic } from "@/config/clinic";
import { findTreatment } from "@/config/treatments";
import { CaseGallery } from "./CaseGallery";
import { PatientVideos } from "./PatientVideos";

/** Before-and-after cases, patient stories and patient videos: each part only when the clinic has supplied it. */
export function Results() {
  const { results } = clinic;
  // A case is shown only while its treatment is offered.
  const cases = results.cases.filter((c) => findTreatment(c.treatment));
  if (!cases.length && !results.stories.length && !results.videos.length) return null;
  return (
    <section id="results" aria-labelledby="results-title" className="on-dark bg-night py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <SectionHeading id="results-title" tone="dark" eyebrow={results.eyebrow} title={results.title} description={cases.length ? results.description : undefined} />
          {cases.length > 0 && (
            <SampleTag tone="dark" className="self-start md:self-auto">
              {results.notice}
            </SampleTag>
          )}
        </div>

        {cases.length > 0 && (
          <div className="mt-12" data-reveal>
            <CaseGallery cases={cases} />
          </div>
        )}

        {results.stories.length > 0 && (
          <div className={cases.length ? "mt-20 border-t border-white/12 pt-14" : "mt-12"}>
            <h3 className="display text-3xl text-white sm:text-4xl" data-reveal>
              {results.storiesTitle}
            </h3>
            <ul className="mt-8 grid gap-5 md:grid-cols-3">
              {results.stories.map((story, i) => (
                <li key={story.quote} data-reveal style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}>
                  <figure className="flex h-full flex-col rounded-[var(--radius-card)] bg-white/6 p-6 ring-1 ring-white/10 sm:p-7">
                    <Icon name="quote" className="size-7 text-sage" />
                    <blockquote className="mt-4 flex-1 font-display text-xl leading-snug text-white/95">{story.quote}</blockquote>
                    <figcaption className="mt-6 flex flex-col items-start gap-3 border-t border-white/10 pt-4 text-sm text-white/65">
                      <span>
                        <span className="font-semibold text-white">{story.name}</span> · {story.treatmentLabel}
                      </span>
                      <SampleTag tone="dark">Sample review</SampleTag>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        )}

        <PatientVideos videos={results.videos} />
      </div>
    </section>
  );
}
