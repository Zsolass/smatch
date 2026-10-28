"use client";

import { useState } from "react";
import { Field, inputProps } from "@/components/ui/FormField";
import { shades, workTypeById, workTypes } from "@/config/case-submission";
import { bridgeNumber, filledBridges, summarizeSelection, type FieldErrors, type Restoration } from "@/lib/case-submission/model";
import type { Action } from "@/lib/case-submission/reducer";
import type { ChartView } from "@/lib/odontogram-geometry";
import { ROLE_LABEL, sortTeeth, sortUnits, spanLabel, validateBridge, type Arch, type BridgeRole } from "@/lib/teeth";
import { ChartLegend, Odontogram, ViewSwitcher } from "./Odontogram";

interface Props {
  restoration: Restoration;
  errors: FieldErrors;
  notice: { messages: string[] } | null;
  dispatch: (a: Action) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  crown: <path d="M6 9c0-2.5 2-4 4-4 1 0 1.5.4 2 .7.5-.3 1-.7 2-.7 2 0 4 1.5 4 4 0 2.4-.9 3.8-1.3 5.8-.4 2-.6 5.2-2 5.2-1.2 0-1.3-2.6-1.8-4-.3-.8-.6-1-.9-1s-.6.2-.9 1c-.5 1.4-.6 4-1.8 4-1.4 0-1.6-3.2-2-5.2C6.9 12.8 6 11.4 6 9Z" />,
  bridge: <path d="M2.5 9.5c0-2 1.4-3.2 3-3.2 1.4 0 2.1 1 2.5 1h8c.4 0 1.1-1 2.5-1 1.6 0 3 1.2 3 3.2 0 2.6-1.4 4-1.6 6.5-.2 2-.5 3.5-1.4 3.5-1.1 0-1.2-2.2-1.6-3.6M2.5 9.5c0 2.6 1.4 4 1.6 6.5.2 2 .5 3.5 1.4 3.5 1.1 0 1.2-2.2 1.6-3.6M8 7.3v4.2h8V7.3" />,
  veneer: <path d="M8 4.5c3.5-1 6.5-1 8 0 .8 4.5.2 9.5-1.5 14-1.5.5-3.5.5-5 0C7.8 14 7.2 9 8 4.5Z" />,
  implant: <path d="M8 3.5h8l-.5 4h-7L8 3.5Zm1 4.5h6M9.5 10h5M9.8 12.5h4.4M10 15h4M10.4 17.5h3.2M12 20.5v-1" />,
  "full-arch": <path d="M3.5 8c0 6.5 3.8 11.5 8.5 11.5S20.5 14.5 20.5 8M6.5 8.3c0 4.6 2.5 8.2 5.5 8.2s5.5-3.6 5.5-8.2" />,
  denture: <path d="M3.5 8.5c0 6 3.8 10.5 8.5 10.5s8.5-4.5 8.5-10.5c-2-1.5-4.5-2-8.5-2s-6.5.5-8.5 2Zm3 1.5h11" />,
  splint: <path d="M4 7.5c0 6.3 3.6 11 8 11s8-4.7 8-11M4 7.5h3M17 7.5h3M7 7.5c0 4.5 2.2 7.5 5 7.5s5-3 5-7.5" />,
};

export function RestorationStep({ restoration: r, errors, notice, dispatch }: Props) {
  const type = r.workType ? workTypeById[r.workType] : null;
  const [role, setRole] = useState<BridgeRole>("abutment");
  // On small screens start zoomed into a quadrant so teeth are easy to tap.
  // (This step only renders in the browser, after the user reaches it.)
  const [view, setView] = useState<ChartView>(() => {
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 639px)").matches) return "full";
    const first = r.teeth[0] ?? r.bridges[0]?.units[0]?.tooth;
    return first ? (`q${Math.floor(first / 10)}` as ChartView) : "q1";
  });

  const summary = summarizeSelection(r);
  const activeBridge = r.bridges.find((b) => b.id === r.activeBridgeId);
  const selectionError = errors.selection;

  return (
    <div className="grid gap-8">
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-ink">
          Type of work <span className="text-accent" aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </legend>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4" id="case-workType" tabIndex={-1}>
          {workTypes.map((w) => {
            const checked = r.workType === w.id;
            return (
              <label
                key={w.id}
                className={`relative flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
                  checked ? "border-accent bg-accent-soft/60 font-medium text-ink" : "border-line bg-white text-ink hover:border-accent/40"
                }`}
              >
                <input type="radio" name="workType" value={w.id} checked={checked} onChange={() => dispatch({ type: "workType", workType: w.id })} className="sr-only" />
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${checked ? "bg-accent text-white" : "bg-paper text-accent"}`}>
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {typeIcons[w.id]}
                  </svg>
                </span>
                <span className="leading-tight">{w.label}</span>
              </label>
            );
          })}
        </div>
        {errors.workType && <ErrorText id="case-workType-error">{errors.workType}</ErrorText>}
      </fieldset>

      {notice && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-warm/40 bg-[#fbf3ea] p-4 text-sm text-ink sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold">Some earlier choices didn&apos;t fit the new work type</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink-soft">
              {notice.messages.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => dispatch({ type: "undoWorkType" })} className="rounded-full bg-night px-3.5 py-1.5 text-sm font-medium text-white hover:bg-night-soft">
              Undo
            </button>
            <button type="button" onClick={() => dispatch({ type: "dismissNotice" })} className="rounded-full px-3 py-1.5 text-sm text-ink-soft hover:bg-ink/5">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {type && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field id="case-material" label="Material" required error={errors.material}>
              <select {...inputProps("case-material", errors.material)} value={r.material} onChange={(e) => dispatch({ type: "restorationField", field: "material", value: e.target.value })}>
                <option value="">Choose a material</option>
                {type.materials.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            {type.shade ? (
              <Field id="case-shade" label="Shade" hint="Optional" error={errors.shade}>
                <select {...inputProps("case-shade", errors.shade)} value={r.shade} onChange={(e) => dispatch({ type: "restorationField", field: "shade", value: e.target.value })}>
                  <option value="">No shade / see instructions</option>
                  {shades.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <p className="self-end rounded-xl bg-paper px-4 py-3 text-sm text-ink-soft">{type.label} doesn&apos;t need a tooth shade.</p>
            )}
          </div>

          <section aria-labelledby="chart-title" className="rounded-[var(--radius-card)] border border-line bg-white">
            <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
              <div>
                <h3 id="chart-title" className="font-semibold text-ink">
                  {type.selection === "arch" ? "Arch selection" : type.selection === "bridge" ? "Bridge teeth" : type.id === "implant" ? "Restoration positions" : "Tooth selection"}
                  <span className="text-accent" aria-hidden="true">
                    {" "}
                    *
                  </span>
                </h3>
                <p id="chart-hint" className="mt-1 text-sm text-ink-soft">
                  {type.hint}
                </p>
              </div>
              {type.selection !== "arch" && <ViewSwitcher view={view} onChange={setView} />}
            </div>

            {type.selection === "bridge" && (
              <div className="flex flex-wrap items-center gap-3 border-b border-line bg-paper/60 px-4 py-3 sm:px-5">
                <span className="text-sm font-medium text-ink" id="role-label">
                  Tap teeth as
                </span>
                <div role="radiogroup" aria-labelledby="role-label" className="inline-flex rounded-full bg-white p-1 ring-1 ring-line">
                  {(["abutment", "pontic"] as BridgeRole[]).map((rl) => (
                    <button
                      key={rl}
                      type="button"
                      role="radio"
                      aria-checked={role === rl}
                      onClick={() => setRole(rl)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${role === rl ? "bg-accent text-white" : "text-ink hover:bg-ink/5"}`}
                    >
                      {ROLE_LABEL[rl]}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-ink-soft">Tap a tooth again with the same role to remove it.</span>
              </div>
            )}

            {type.selection === "arch" && (
              <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper/60 px-4 py-3 sm:px-5" role="group" aria-label="Arch">
                {(
                  [
                    ["upper", "Upper"],
                    ["lower", "Lower"],
                  ] as [Arch, string][]
                ).map(([arch, label]) => (
                  <button
                    key={arch}
                    type="button"
                    aria-pressed={r.arches.includes(arch)}
                    onClick={() => dispatch({ type: "toggleArch", arch })}
                    className={`rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors ${r.arches.includes(arch) ? "bg-accent text-white ring-accent" : "bg-white text-ink ring-line hover:ring-accent/50"}`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  aria-pressed={r.arches.length === 2}
                  onClick={() => dispatch({ type: "setArches", arches: r.arches.length === 2 ? [] : ["upper", "lower"] })}
                  className={`rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors ${r.arches.length === 2 ? "bg-accent text-white ring-accent" : "bg-white text-ink ring-line hover:ring-accent/50"}`}
                >
                  Both
                </button>
              </div>
            )}

            <div className="grid xl:grid-cols-[minmax(0,1fr)_16rem]">
              <div className="p-2 sm:p-4" id="case-selection" tabIndex={-1}>
                <Odontogram
                  mode={type.selection}
                  restoration={r}
                  view={type.selection === "arch" ? "full" : view}
                  onViewChange={setView}
                  describedBy="chart-hint"
                  onTooth={(tooth) => dispatch(type.selection === "bridge" ? { type: "bridgeClick", tooth, role } : { type: "toggleTooth", tooth })}
                  onArch={(arch) => dispatch({ type: "toggleArch", arch })}
                />
              </div>

              <div className="border-t border-line p-4 sm:p-5 xl:border-t-0 xl:border-l">
                <p className="text-sm font-semibold text-ink" aria-live="polite">
                  {type.selection === "teeth" && (r.teeth.length ? `Selected teeth: ${sortTeeth(r.teeth).join(", ")}` : "No teeth selected yet")}
                  {type.selection === "arch" && (summary?.heading ?? "")}
                  {type.selection === "bridge" && (summary?.heading ?? "")}
                </p>

                {type.selection === "teeth" && r.teeth.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {sortTeeth(r.teeth).map((t) => (
                      <li key={t}>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: "toggleTooth", tooth: t })}
                          className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-sm font-medium text-accent-strong hover:bg-accent hover:text-white"
                          aria-label={`Remove tooth ${t}`}
                        >
                          {t}
                          <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {type.selection === "teeth" && r.teeth.length > 0 && <p className="mt-3 text-xs text-ink-soft">Each selected tooth is recorded as: {type.toothRole}.</p>}

                {type.selection === "bridge" && (
                  <BridgeList restoration={r} errors={errors} dispatch={dispatch} />
                )}

                {type.selection === "bridge" && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "newBridge" })}
                    disabled={!activeBridge || activeBridge.units.length === 0}
                    className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-accent/50 px-3 py-2.5 text-sm font-medium text-accent hover:bg-accent-soft/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span aria-hidden="true">+</span> Add another bridge
                  </button>
                )}

                {(r.teeth.length > 0 || filledBridges(r).length > 0 || r.arches.length > 0) && (
                  <button type="button" onClick={() => dispatch({ type: "clearSelection" })} className="mt-4 text-sm font-medium text-ink-soft underline underline-offset-4 hover:text-ink">
                    Clear selection
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:px-5">
              <ChartLegend mode={type.selection} />
              <p className="text-xs text-ink-soft">FDI numbering, viewed facing the patient. The chart records your order; it doesn&apos;t make clinical choices for you.</p>
            </div>
          </section>
          {selectionError && <ErrorText id="case-selection-error">{selectionError}</ErrorText>}

          <Field id="case-notes" label="Notes on the restoration" hint="Optional">
            <textarea
              {...inputProps("case-notes")}
              rows={3}
              placeholder="e.g. pontic design, contact strength, characterisation"
              value={r.notes}
              onChange={(e) => dispatch({ type: "restorationField", field: "notes", value: e.target.value })}
              maxLength={1000}
            />
          </Field>
        </>
      )}
    </div>
  );
}

function BridgeList({ restoration: r, errors, dispatch }: { restoration: Restoration; errors: FieldErrors; dispatch: (a: Action) => void }) {
  if (r.bridges.length === 0) return <p className="mt-2 text-sm text-ink-soft">Select a tooth on the chart to start a bridge.</p>;
  return (
    <ul className="mt-3 grid gap-3">
      {r.bridges.map((b) => {
        const n = bridgeNumber(r, b.id);
        const active = b.id === r.activeBridgeId;
        const error = errors[`bridge:${b.id}`];
        const live = b.units.length >= 2 ? validateBridge(b) : [];
        return (
          <li key={b.id} id={`case-bridge-${b.id}`} tabIndex={-1} className={`rounded-xl border p-3 ${active ? "border-accent bg-accent-soft/40" : "border-line bg-white"} ${error ? "border-danger" : ""}`}>
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={() => dispatch({ type: "selectBridge", bridgeId: b.id })} className="text-left text-sm font-semibold text-ink" aria-pressed={active}>
                Bridge {n}
                {b.units.length > 0 && <span className="font-normal text-ink-soft"> · {spanLabel(b.units.map((u) => u.tooth))}</span>}
                {active && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[0.68rem] font-medium text-white">Editing</span>}
              </button>
              <button type="button" onClick={() => dispatch({ type: "removeBridge", bridgeId: b.id })} className="text-xs text-ink-soft underline-offset-2 hover:text-danger hover:underline" aria-label={`Remove bridge ${n}`}>
                Remove
              </button>
            </div>
            {b.units.length === 0 ? (
              <p className="mt-1 text-xs text-ink-soft">Select teeth on the chart.</p>
            ) : (
              <ul className="mt-2 grid gap-1.5">
                {sortUnits(b.units).map((u) => (
                  <li key={u.tooth} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium tabular-nums">{u.tooth}</span>
                    <span className="flex items-center gap-1">
                      <select
                        aria-label={`Role of tooth ${u.tooth} in bridge ${n}`}
                        value={u.role}
                        onChange={(e) => dispatch({ type: "unitRole", bridgeId: b.id, tooth: u.tooth, role: e.target.value as BridgeRole })}
                        className="rounded-lg border border-line bg-white px-2 py-1 text-sm"
                      >
                        <option value="abutment">Abutment</option>
                        <option value="pontic">Pontic</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "removeUnit", bridgeId: b.id, tooth: u.tooth })}
                        className="grid size-7 place-items-center rounded-full text-ink-soft hover:bg-ink/5 hover:text-danger"
                        aria-label={`Remove tooth ${u.tooth} from bridge ${n}`}
                      >
                        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {(error || live.length > 0) && (
              <p className={`mt-2 text-xs ${error ? "text-danger" : "text-ink-soft"}`} role={error ? "alert" : undefined}>
                {error ?? live.join(" ")}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-sm text-danger">
      <svg viewBox="0 0 16 16" className="mt-0.5 size-3.5 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 3a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 4.5Zm0 7.25a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Z" />
      </svg>
      {children}
    </p>
  );
}
