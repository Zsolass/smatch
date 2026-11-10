import Link from "next/link";
import { CaseGallery } from "@/components/home/CaseGallery";
import { ContactSection } from "@/components/home/ContactSection";
import { ConsultationFeeCard } from "@/components/home/Costs";
import { FaqList } from "@/components/home/Faq";
import { FeeList } from "@/components/home/FeeList";
import { TeamCard } from "@/components/home/TeamCard";
import { BookingLink, CallLink } from "@/components/site/BookingLink";
import { Arrow } from "@/components/ui/Button";
import { CheckBullet, Icon } from "@/components/ui/Icon";
import { Picture } from "@/components/ui/Picture";
import { SampleNotice, SampleTag } from "@/components/ui/SampleTag";
import { clinic } from "@/config/clinic";
import { enabledTreatments, type Treatment } from "@/config/treatments";
import { formatMoney } from "@/lib/format";

const section = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const h2 = "display text-[2rem] text-balance text-ink sm:text-[2.75rem]";

/**
 * The one template behind every treatment page. Each block appears only when
 * the treatment's configuration has content for it:
 * introduction and booking, common concerns, the explanation and options,
 * how suitability is assessed, cases, the process, fees, the clinicians,
 * questions, and a consultation request with this treatment preselected.
 */
export function TreatmentPage({ treatment: t }: { treatment: Treatment }) {
  const cases = clinic.results.cases.filter((c) => t.caseIds.includes(c.id));
  const fees = clinic.costs.fees.filter((f) => t.feeIds.includes(f.id));
  const clinicians = clinic.team.members.filter((m) => t.clinicianIds.includes(m.id));
  const reviewer = t.reviewedBy ? clinic.team.members.find((m) => m.id === t.reviewedBy!.memberId) : undefined;
  const others = enabledTreatments.filter((o) => o.id !== t.id);
  const consultation = clinic.costs.consultation;

  return (
    <>
      {/* 1. Name, introduction and the consultation call to action */}
      <section aria-labelledby="treatment-title" className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-[-12rem] -z-10 size-[40rem] rounded-full bg-accent-soft/70 blur-3xl" />
        <div className={`${section} grid items-center gap-12 pt-8 pb-16 sm:pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pb-20`}>
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-ink hover:underline">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href="/treatments" className="hover:text-ink hover:underline">
                    Treatments
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-ink">
                  {t.name}
                </li>
              </ol>
            </nav>
            <p className="eyebrow mt-8">{t.need.title}</p>
            <h1 id="treatment-title" className="display mt-5 text-[2.625rem] text-balance text-ink sm:text-6xl">
              {t.name}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-pretty text-ink-soft sm:text-xl sm:leading-relaxed">{t.intro}</p>
            {t.urgentNotice && (
              <p role="note" className="mt-6 flex max-w-xl items-start gap-3 rounded-2xl border border-danger/25 bg-danger-soft p-4 text-[0.9375rem] text-danger">
                <Icon name="urgent" className="mt-0.5 size-5 shrink-0" />
                <span>{t.urgentNotice}</span>
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              {t.urgentNotice ? (
                <>
                  <CallLink placement="treatment-hero" variant="primary" size="lg" />
                  <BookingLink placement="treatment-hero" treatment={t.id} variant="secondary" size="lg" />
                </>
              ) : (
                <>
                  <BookingLink placement="treatment-hero" treatment={t.id} size="lg" arrow />
                  <CallLink placement="treatment-hero" size="lg" />
                </>
              )}
            </div>
            <p className="mt-5 text-[0.9375rem] text-ink-soft">
              {consultation.label} {formatMoney(consultation.amount)} · {consultation.duration.toLowerCase()}, with a written plan to take home.
            </p>
          </div>
          <figure className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="arch overflow-hidden bg-paper-deep shadow-[var(--shadow-lift)]">
              <Picture image={t.image} priority sizes="(min-width: 1024px) 520px, (min-width: 640px) 448px, 92vw" className="aspect-[4/3] w-full object-cover sm:aspect-[5/4]" />
            </div>
            <figcaption className="mt-3 flex justify-end">
              <SampleTag>Illustration</SampleTag>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 2. Common concerns */}
      {t.concerns.length > 0 && (
        <section aria-labelledby="concerns-title" className="border-y border-line/80 bg-surface/70 py-14 sm:py-16">
          <div className={`${section} grid gap-8 lg:grid-cols-[0.8fr_1.6fr] lg:gap-16`}>
            <div data-reveal>
              <p className="eyebrow">Is this you?</p>
              <h2 id="concerns-title" className="display mt-4 text-3xl text-ink sm:text-4xl">
                Patients often come to us with
              </h2>
            </div>
            <ul className="flex flex-wrap content-start gap-2.5" data-reveal>
              {t.concerns.map((c) => (
                <li key={c} className="rounded-full border border-line bg-paper px-5 py-2.5 text-[0.9375rem] text-ink">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 3. The treatment explained, with the options and alternatives */}
      <section aria-labelledby="explained-title" className="py-20 sm:py-24">
        <div className={section}>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.6fr] lg:gap-16">
            <div data-reveal>
              <p className="eyebrow">In short</p>
              <h2 id="explained-title" className={`${h2} mt-4`}>
                {t.explanation.title}
              </h2>
            </div>
            <div className="grid max-w-3xl gap-5 border-l-2 border-accent/60 pl-6 text-lg text-ink sm:pl-8" data-reveal>
              {t.explanation.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>

          {t.options.map((group) => (
            <div key={group.title} className="mt-16">
              <h3 className="display text-3xl text-ink" data-reveal>
                {group.title}
              </h3>
              {group.description && (
                <p className="mt-3 max-w-2xl text-ink-soft" data-reveal>
                  {group.description}
                </p>
              )}
              <ul className={`mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 ${group.items.length === 3 || group.items.length > 4 ? "lg:grid-cols-3" : group.items.length >= 4 ? "lg:grid-cols-4" : ""}`}>
                {group.items.map((option, i) => (
                  <li key={option.title} className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-card)]" data-reveal style={{ "--reveal-delay": `${(i % 4) * 60}ms` } as React.CSSProperties}>
                    <p className="font-display text-lg text-accent/60 italic" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h4 className="display mt-2 text-[1.375rem] leading-snug text-ink">{option.title}</h4>
                    <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-ink-soft">{option.description}</p>
                    {(option.suits || option.consider) && (
                      <dl className="mt-5 grid gap-3 border-t border-line pt-4 text-sm">
                        {option.suits && (
                          <div>
                            <dt className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">When it is chosen</dt>
                            <dd className="mt-1 leading-relaxed text-ink">{option.suits}</dd>
                          </div>
                        )}
                        {option.consider && (
                          <div>
                            <dt className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">Worth knowing</dt>
                            <dd className="mt-1 leading-relaxed text-ink">{option.consider}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {t.comparison && (
            <div className="mt-16" data-reveal>
              <h3 className="display text-3xl text-ink">{t.comparison.title}</h3>
              {/* Scrolls sideways inside its own frame on narrow screens; reachable by keyboard. */}
              <div role="region" aria-label={t.comparison.title} tabIndex={0} className="mt-6 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
                <table className="w-full min-w-[38rem] border-collapse text-left text-[0.9375rem]">
                  <thead>
                    <tr className="bg-accent-soft/60">
                      <td className="p-4" />
                      {t.comparison.columns.map((c) => (
                        <th key={c} scope="col" className="p-4 font-semibold text-ink">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.comparison.rows.map((row) => (
                      <tr key={row.label} className="border-t border-line">
                        <th scope="row" className="p-4 font-normal text-ink-soft">
                          {row.label}
                        </th>
                        {row.values.map((v, i) => (
                          <td key={i} className="p-4 text-ink">
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-ink-soft">A general guide. Which options are open to you is decided at your consultation.</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. How suitability is assessed */}
      <section aria-labelledby="suitability-title" className="bg-paper-deep/70 py-20 sm:py-24">
        <div className={`${section} grid gap-10 lg:grid-cols-2 lg:gap-16`}>
          <div data-reveal>
            <p className="eyebrow">Suitability</p>
            <h2 id="suitability-title" className={`${h2} mt-4`}>
              {t.suitability.title}
            </h2>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">{t.suitability.intro}</p>
            <BookingLink placement="treatment-suitability" treatment={t.id} className="mt-8" arrow />
          </div>
          <div data-reveal>
            <ul className="grid gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
              {t.suitability.factors.map((f) => (
                <li key={f} className="flex gap-3.5 text-ink">
                  <CheckBullet />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-soft">Only an examination can confirm what is suitable for you. Your dentist explains the reasons for any recommendation.</p>
          </div>
        </div>
      </section>

      {/* 5. Relevant cases */}
      {cases.length > 0 && (
        <section aria-labelledby="cases-title" className="on-dark bg-night py-20 text-white sm:py-24">
          <div className={section}>
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between" data-reveal>
              <div>
                <p className="eyebrow">Results</p>
                <h2 id="cases-title" className="display mt-4 text-[2rem] text-white sm:text-[2.75rem]">
                  A case like <em>this one</em>
                </h2>
              </div>
              <SampleTag tone="dark" className="self-start md:self-auto">
                {clinic.results.notice}
              </SampleTag>
            </div>
            <div className="mt-10" data-reveal>
              <CaseGallery cases={cases} treatmentLinks={false} />
            </div>
            <p className="mt-8 text-sm text-white/60">Every case is different, and results depend on each patient’s situation.</p>
          </div>
        </section>
      )}

      {/* 6. The clinic's process */}
      <section aria-labelledby="process-title" className="py-20 sm:py-24">
        <div className={`${section} grid gap-10 lg:grid-cols-[0.8fr_1.6fr] lg:gap-16`}>
          <div data-reveal>
            <p className="eyebrow">Step by step</p>
            <h2 id="process-title" className={`${h2} mt-4`}>
              {t.process.title}
            </h2>
          </div>
          <ol className="grid gap-0">
            {t.process.steps.map((step, i) => {
              const newStage = step.stage && step.stage !== t.process.steps[i - 1]?.stage;
              return (
                <li key={step.title} className="relative grid grid-cols-[3rem_1fr] gap-x-5 pb-9 last:pb-0" data-reveal>
                  {i < t.process.steps.length - 1 && <span aria-hidden="true" className="absolute top-12 bottom-0 left-6 w-px bg-line" />}
                  <span className="grid size-12 place-items-center rounded-full border border-accent/40 bg-surface font-display text-xl text-accent italic" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="pt-1.5">
                    {newStage && <p className="mb-2 inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold tracking-[0.12em] text-accent uppercase">{step.stage}</p>}
                    <h3 className="display text-2xl text-ink">
                      <span className="sr-only">Step {i + 1}: </span>
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-ink-soft">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 7. Costs, inclusions and financing */}
      <section aria-labelledby="treatment-costs-title" className="bg-paper-deep/70 py-20 sm:py-24">
        <div className={section}>
          <p className="eyebrow" data-reveal>
            Costs
          </p>
          <h2 id="treatment-costs-title" className={`${h2} mt-4`} data-reveal>
            Fees for {t.name.toLowerCase()}
          </h2>
          <div className="mt-10 grid gap-10 lg:grid-cols-[0.8fr_1.5fr] lg:gap-14">
            <div data-reveal>
              <ConsultationFeeCard treatment={t.id} placement="treatment-costs" />
            </div>
            <div data-reveal>
              {fees.length > 0 ? <FeeList fees={fees} /> : <p className="text-ink-soft">Fees for this treatment are confirmed in your written plan.</p>}
              {t.feeNote && <p className="mt-5 text-ink-soft">{t.feeNote}</p>}
              <SampleNotice className="mt-4">{clinic.costs.notice}</SampleNotice>
              <Link href="/#costs" className="mt-6 inline-flex items-center gap-2 font-semibold text-accent underline-offset-4 hover:underline">
                {clinic.costs.financing ? "All fees, payment and financing" : "All fees"} <Arrow />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. The clinicians */}
      {clinicians.length > 0 && (
        <section aria-labelledby="clinicians-title" className="py-20 sm:py-24">
          <div className={`${section} grid gap-10 lg:grid-cols-[0.8fr_1.6fr] lg:gap-16`}>
            <div data-reveal>
              <p className="eyebrow">Your clinician</p>
              <h2 id="clinicians-title" className={`${h2} mt-4`}>
                Who you will see
              </h2>
              <p className="mt-5 text-ink-soft">The dentist who assesses you also plans your treatment and stays responsible for it from the first visit to the last.</p>
            </div>
            <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2">
              {clinicians.map((m) => (
                <li key={m.id} data-reveal>
                  <TeamCard member={m} compact />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 9. Treatment-specific questions */}
      {t.faq.length > 0 && (
        <section aria-labelledby="treatment-faq-title" className={`border-t border-line/80 py-20 sm:py-24 ${clinicians.length ? "" : "bg-transparent"}`}>
          <div className={`${section} grid gap-10 lg:grid-cols-[0.8fr_1.6fr] lg:gap-16`}>
            <div data-reveal>
              <p className="eyebrow">Questions</p>
              <h2 id="treatment-faq-title" className={`${h2} mt-4`}>
                Asked before the first visit
              </h2>
            </div>
            <div data-reveal>
              <FaqList items={t.faq} />
              {reviewer && t.reviewedBy ? (
                <p className="mt-6 text-sm text-ink-soft">
                  Clinically reviewed by {reviewer.name}
                  {reviewer.credentials ? `, ${reviewer.credentials}` : ""} · {t.reviewedBy.date}
                </p>
              ) : (
                <SampleNotice className="mt-6">{clinic.clinicalNotice}</SampleNotice>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 10. Consultation request with this treatment preselected */}
      <ContactSection treatment={t.id} title={`Talk to us about *${t.shortName.toLowerCase()}*`} placement="treatment-form" description="Send a short request and we will contact you to arrange a consultation. Your treatment interest is already filled in." />

      {others.length > 0 && (
        <nav aria-labelledby="other-treatments-title" className="border-t border-line/80 py-14">
          <div className={section}>
            <h2 id="other-treatments-title" className="text-xs font-semibold tracking-[0.14em] text-ink-soft uppercase">
              Other treatments
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2.5">
              {others.map((o) => (
                <li key={o.id}>
                  <Link href={`/treatments/${o.id}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-5 text-[0.9375rem] font-semibold text-ink transition-colors hover:border-accent/50 hover:text-accent">
                    {o.name} <Arrow />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </>
  );
}
