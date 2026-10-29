"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { SelectionMode } from "@/config/case-submission";
import { bridgeNumber, type Restoration } from "@/lib/case-submission/model";
import {
  ARCH_CENTRE,
  fissurePath,
  GEOMETRY_BY_ID,
  TOOTH_GEOMETRY,
  toothPath,
  VIEW_BOXES,
  type ChartView,
  type ToothGeometry,
} from "@/lib/odontogram-geometry";
import { ARCH_ORDER, getTooth, ROLE_LABEL, sortUnits, type Arch } from "@/lib/teeth";

type ToothState = "idle" | "selected" | "abutment" | "pontic" | "arch";

interface Props {
  mode: SelectionMode;
  restoration: Restoration;
  view: ChartView;
  onViewChange: (view: ChartView) => void;
  onTooth: (id: number) => void;
  onArch: (arch: Arch) => void;
  describedBy?: string;
}

const KEY_ORDER = [...ARCH_ORDER.upper, ...ARCH_ORDER.lower];

const quadrantOf = (id: number): ChartView => `q${Math.floor(id / 10)}` as ChartView;

export function Odontogram({ mode, restoration: r, view, onViewChange, onTooth, onArch, describedBy }: Props) {
  const refs = useRef(new Map<number, SVGGElement>());
  const [focusId, setFocusId] = useState<number>(r.teeth[0] ?? r.bridges[0]?.units[0]?.tooth ?? 11);
  const [ringId, setRingId] = useState<number | null>(null);
  const interactive = mode !== "arch";

  const stateOf = (id: number): { state: ToothState; muted: boolean; bridge?: number } => {
    const arch = getTooth(id).arch;
    if (mode === "arch") return { state: r.arches.includes(arch) ? "arch" : "idle", muted: false };
    if (mode === "teeth") return { state: r.teeth.includes(id) ? "selected" : "idle", muted: false };
    const bridge = r.bridges.find((b) => b.units.some((u) => u.tooth === id));
    if (!bridge) return { state: "idle", muted: false };
    const unit = bridge.units.find((u) => u.tooth === id)!;
    return { state: unit.role, muted: bridge.id !== r.activeBridgeId, bridge: bridgeNumber(r, bridge.id) };
  };

  const describe = (g: ToothGeometry) => {
    const tooth = getTooth(g.id);
    const { state, bridge } = stateOf(g.id);
    const name = `Tooth ${g.id}, ${tooth.name}`;
    if (mode === "bridge") return state === "idle" ? `${name}, not in a bridge` : `${name}, ${ROLE_LABEL[state as "abutment" | "pontic"].toLowerCase()} in bridge ${bridge}`;
    return name;
  };

  const focusTooth = (id: number) => {
    setFocusId(id);
    if (view !== "full" && quadrantOf(id) !== view) onViewChange(quadrantOf(id));
    requestAnimationFrame(() => refs.current.get(id)?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<SVGGElement>, id: number) => {
    const t = getTooth(id);
    const row = ARCH_ORDER[t.arch];
    let next: number | undefined;
    switch (e.key) {
      case "ArrowRight":
        next = row[Math.min(t.archIndex + 1, row.length - 1)];
        break;
      case "ArrowLeft":
        next = row[Math.max(t.archIndex - 1, 0)];
        break;
      case "ArrowUp":
        next = ARCH_ORDER.upper[t.archIndex];
        break;
      case "ArrowDown":
        next = ARCH_ORDER.lower[t.archIndex];
        break;
      case "Home":
        next = row[0];
        break;
      case "End":
        next = row.at(-1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onTooth(id);
        return;
      default:
        return;
    }
    e.preventDefault();
    if (next !== undefined && next !== id) focusTooth(next);
  };

  const vb = VIEW_BOXES[view];
  const tabTarget = KEY_ORDER.includes(focusId) ? focusId : 11;

  // Connector bars between neighbouring units of each bridge.
  const connectors = mode === "bridge"
    ? r.bridges.flatMap((b) => {
        const units = sortUnits(b.units);
        const segs: { key: string; a: ToothGeometry; b: ToothGeometry; active: boolean }[] = [];
        for (let i = 1; i < units.length; i++) {
          const ta = getTooth(units[i - 1]!.tooth), tb = getTooth(units[i]!.tooth);
          if (ta.arch === tb.arch && Math.abs(ta.archIndex - tb.archIndex) === 1) {
            segs.push({ key: `${b.id}-${i}`, a: GEOMETRY_BY_ID.get(ta.id)!, b: GEOMETRY_BY_ID.get(tb.id)!, active: b.id === r.activeBridgeId });
          }
        }
        return segs;
      })
    : [];

  const archLabel = mode === "arch" ? `Arch chart. ${r.arches.length ? r.arches.map((a) => `${a} arch`).join(" and ") + " selected" : "No arch selected"}.` : undefined;

  return (
    <svg
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      className="h-auto w-full touch-manipulation select-none"
      role={interactive ? "group" : "img"}
      aria-label={interactive ? "Tooth chart, FDI numbering. Use arrow keys to move between teeth and Enter or Space to select." : archLabel}
      aria-describedby={describedBy}
      style={{ transition: "none" }}
    >
      <defs>
        <pattern id="pontic-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="var(--color-accent-soft)" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-accent)" strokeWidth="2.4" />
        </pattern>
      </defs>

      {/* Orientation guides */}
      <g aria-hidden="true" className="pointer-events-none">
        <line x1={ARCH_CENTRE.x} x2={ARCH_CENTRE.x} y1={vb.y + 8} y2={vb.y + vb.h - 8} stroke="var(--color-line)" strokeDasharray="3 5" />
        <line x1={ARCH_CENTRE.x - 150} x2={ARCH_CENTRE.x + 150} y1={(ARCH_CENTRE.upperY + ARCH_CENTRE.lowerY) / 2} y2={(ARCH_CENTRE.upperY + ARCH_CENTRE.lowerY) / 2} stroke="var(--color-line)" strokeDasharray="3 5" />
        <text x={ARCH_CENTRE.x} y={(ARCH_CENTRE.upperY + ARCH_CENTRE.lowerY) / 2 - 64} textAnchor="middle" className="fill-ink-soft text-[11px] font-semibold tracking-[0.12em] uppercase">
          Upper
        </text>
        <text x={ARCH_CENTRE.x} y={(ARCH_CENTRE.upperY + ARCH_CENTRE.lowerY) / 2 + 72} textAnchor="middle" className="fill-ink-soft text-[11px] font-semibold tracking-[0.12em] uppercase">
          Lower
        </text>
        <text x={ARCH_CENTRE.x - 92} y={(ARCH_CENTRE.upperY + ARCH_CENTRE.lowerY) / 2 + 4} textAnchor="middle" className="fill-ink-soft/80 text-[10px]">
          Patient&apos;s right
        </text>
        <text x={ARCH_CENTRE.x + 92} y={(ARCH_CENTRE.upperY + ARCH_CENTRE.lowerY) / 2 + 4} textAnchor="middle" className="fill-ink-soft/80 text-[10px]">
          Patient&apos;s left
        </text>
      </g>

      {/* Whole-arch highlight */}
      {mode === "arch" &&
        (["upper", "lower"] as Arch[]).map((arch) =>
          r.arches.includes(arch) ? (
            <path key={arch} d={archBand(arch)} fill="none" stroke="var(--color-accent)" strokeOpacity="0.16" strokeWidth="62" strokeLinecap="round" aria-hidden="true" />
          ) : null,
        )}

      {TOOTH_GEOMETRY.map((g) => {
        const { state, muted } = stateOf(g.id);
        const selected = state !== "idle";
        const common = {
          className: "tooth",
          "data-state": state,
          "data-muted": muted ? "true" : undefined,
          transform: `translate(${g.x.toFixed(2)} ${g.y.toFixed(2)}) rotate(${g.rotate.toFixed(2)})`,
          onClick: () => (mode === "arch" ? onArch(g.arch) : onTooth(g.id)),
        };
        const shapes = (
          <>
            {/* Larger invisible hit area for touch */}
            <rect x={-g.w / 2 - 2} y={-g.d / 2 - 14} width={g.w + 4} height={g.d + 20} fill="transparent" />
            <path className="shape" d={toothPath(g.type, g.w, g.d)} />
            <path className="fissure" d={fissurePath(g.type, g.w, g.d)} />
          </>
        );
        if (!interactive) {
          return (
            <g key={g.id} {...common} aria-hidden="true">
              {shapes}
            </g>
          );
        }
        return (
          <g
            key={g.id}
            {...common}
            ref={(el) => {
              if (el) refs.current.set(g.id, el);
              else refs.current.delete(g.id);
            }}
            role={mode === "teeth" ? "checkbox" : "button"}
            aria-checked={mode === "teeth" ? selected : undefined}
            aria-label={describe(g)}
            tabIndex={g.id === tabTarget ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, g.id)}
            onFocus={(e) => {
              setFocusId(g.id);
              setRingId(e.currentTarget.matches(":focus-visible") ? g.id : null);
            }}
            onBlur={() => setRingId(null)}
          >
            {shapes}
          </g>
        );
      })}

      {connectors.map(({ key, a, b, active }) => (
        <g key={key} aria-hidden="true" className="pointer-events-none">
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--color-accent-strong)" strokeOpacity={active ? 0.9 : 0.4} strokeWidth="5" strokeLinecap="round" />
          <circle cx={a.x} cy={a.y} r="3.2" fill="#fff" stroke="var(--color-accent-strong)" strokeWidth="1.5" />
          <circle cx={b.x} cy={b.y} r="3.2" fill="#fff" stroke="var(--color-accent-strong)" strokeWidth="1.5" />
        </g>
      ))}

      {TOOTH_GEOMETRY.map((g) => {
        const { state } = stateOf(g.id);
        return (
          <text key={g.id} x={g.labelX} y={g.labelY} dy="0.35em" textAnchor="middle" className="tooth-label" data-active={state !== "idle" && state !== "arch" ? "true" : undefined} aria-hidden="true">
            {g.id}
          </text>
        );
      })}

      {ringId !== null && (() => {
        const g = GEOMETRY_BY_ID.get(ringId)!;
        return <circle className="tooth-focus" cx={g.x} cy={g.y} r={Math.max(g.w, g.d) / 2 + 5} />;
      })()}
    </svg>
  );
}

function archBand(arch: Arch): string {
  const ids = ARCH_ORDER[arch];
  return ids
    .map((id, i) => {
      const g = GEOMETRY_BY_ID.get(id)!;
      return `${i === 0 ? "M" : "L"} ${g.x.toFixed(1)} ${g.y.toFixed(1)}`;
    })
    .join(" ");
}

export function ChartLegend({ mode }: { mode: SelectionMode }) {
  const items: { label: string; swatch: React.ReactNode }[] = [
    { label: "Not selected", swatch: <rect x="1" y="1" width="16" height="12" rx="4" fill="#fff" stroke="#b8b0a2" /> },
  ];
  if (mode === "teeth") items.push({ label: "Selected", swatch: <rect x="1" y="1" width="16" height="12" rx="4" fill="var(--color-accent)" /> });
  if (mode === "bridge") {
    items.push(
      { label: "Abutment (solid)", swatch: <rect x="1" y="1" width="16" height="12" rx="4" fill="var(--color-accent)" /> },
      { label: "Pontic (striped, dashed outline)", swatch: <rect x="1" y="1" width="16" height="12" rx="4" fill="url(#legend-hatch)" stroke="var(--color-accent-strong)" strokeDasharray="3 2" /> },
      { label: "Bridge connector", swatch: <line x1="2" y1="7" x2="16" y2="7" stroke="var(--color-accent-strong)" strokeWidth="4" strokeLinecap="round" /> },
      { label: "Other bridge (faded)", swatch: <rect x="1" y="1" width="16" height="12" rx="4" fill="var(--color-accent)" opacity="0.5" /> },
    );
  }
  if (mode === "arch") items.push({ label: "Arch selected (highlighted band)", swatch: <rect x="1" y="1" width="16" height="12" rx="4" fill="var(--color-accent-soft)" stroke="var(--color-accent)" /> });
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-soft" aria-label="Chart legend">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <svg viewBox="0 0 18 14" className="h-3.5 w-[1.15rem] shrink-0" aria-hidden="true">
            <defs>
              <pattern id="legend-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="5" height="5" fill="var(--color-accent-soft)" />
                <line x1="0" y1="0" x2="0" y2="5" stroke="var(--color-accent)" strokeWidth="2" />
              </pattern>
            </defs>
            {item.swatch}
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  );
}

const VIEW_LABEL: Record<ChartView, string> = {
  full: "Full mouth",
  q1: "Upper right (Q1)",
  q2: "Upper left (Q2)",
  q3: "Lower left (Q3)",
  q4: "Lower right (Q4)",
};

/** Quadrant zoom laid out like the chart itself: Q1 top-left, Q2 top-right, Q4 bottom-left, Q3 bottom-right. */
export function ViewSwitcher({ view, onChange }: { view: ChartView; onChange: (v: ChartView) => void }) {
  const btn = (v: ChartView, label: string, extra = "") => (
    <button
      type="button"
      onClick={() => onChange(v)}
      aria-pressed={view === v}
      aria-label={`Show ${VIEW_LABEL[v]}`}
      className={`rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${view === v ? "bg-accent text-white" : "bg-white text-ink ring-1 ring-line hover:ring-accent/40"} ${extra}`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex items-center gap-3" role="group" aria-label="Chart zoom">
      <span className="text-xs font-medium text-ink-soft">Zoom</span>
      {btn("full", "Full")}
      <div className="grid grid-cols-2 gap-1">
        {btn("q1", "UR")}
        {btn("q2", "UL")}
        {btn("q4", "LR")}
        {btn("q3", "LL")}
      </div>
    </div>
  );
}

export { VIEW_LABEL };
