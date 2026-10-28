// Wizard state for the case submission demo. Kept in memory only: a reload
// starts a clean case, and nothing is written to localStorage.

import type { FileCategory, WorkTypeId } from "@/config/case-submission";
import type { Arch, BridgeRole } from "@/lib/teeth";
import {
  applyBridgeClick,
  changeWorkType,
  clearSelection,
  emptyDraft,
  removeBridge,
  removeUnit,
  setUnitRole,
  startNewBridge,
  toggleArch,
  toggleTooth,
  type CaseDraft,
  type CaseFile,
  type PracticeDetails,
  type Restoration,
} from "./model";

export interface WizardState {
  draft: CaseDraft;
  step: number;
  /** Furthest step reached; earlier steps can be revisited from the stepper. */
  furthest: number;
  /** Show validation errors for the current step (after a Next/Submit attempt). */
  showErrors: boolean;
  /** Last work-type change that cleared something, with an undo snapshot. */
  notice: { messages: string[]; previous: Restoration } | null;
  /** Set when a step was opened from the review, to offer a quick way back. */
  returnToReview: boolean;
}

export type Action =
  | { type: "practice"; field: keyof PracticeDetails; value: string }
  | { type: "workType"; workType: WorkTypeId; silent?: boolean }
  | { type: "undoWorkType" }
  | { type: "dismissNotice" }
  | { type: "restorationField"; field: "material" | "shade" | "notes"; value: string }
  | { type: "toggleTooth"; tooth: number }
  | { type: "bridgeClick"; tooth: number; role: BridgeRole }
  | { type: "unitRole"; bridgeId: string; tooth: number; role: BridgeRole }
  | { type: "removeUnit"; bridgeId: string; tooth: number }
  | { type: "newBridge" }
  | { type: "selectBridge"; bridgeId: string }
  | { type: "removeBridge"; bridgeId: string }
  | { type: "toggleArch"; arch: Arch }
  | { type: "setArches"; arches: Arch[] }
  | { type: "clearSelection" }
  | { type: "addFiles"; files: CaseFile[] }
  | { type: "removeFile"; id: string }
  | { type: "fileCategory"; id: string; category: FileCategory }
  | { type: "instructions"; value: string }
  | { type: "goto"; step: number; fromReview?: boolean }
  | { type: "showErrors" }
  | { type: "loadDraft"; draft: CaseDraft }
  | { type: "reset" };

export const initialState = (): WizardState => ({
  draft: emptyDraft(),
  step: 0,
  furthest: 0,
  showErrors: false,
  notice: null,
  returnToReview: false,
});

const withRestoration = (s: WizardState, restoration: Restoration): WizardState => ({ ...s, draft: { ...s.draft, restoration } });

export function reducer(s: WizardState, a: Action): WizardState {
  const r = s.draft.restoration;
  switch (a.type) {
    case "practice":
      return { ...s, draft: { ...s.draft, practice: { ...s.draft.practice, [a.field]: a.value } } };
    case "workType": {
      const { restoration, messages } = changeWorkType(r, a.workType);
      return { ...withRestoration(s, restoration), notice: messages.length && !a.silent ? { messages, previous: r } : null };
    }
    case "undoWorkType":
      return s.notice ? { ...withRestoration(s, s.notice.previous), notice: null } : s;
    case "dismissNotice":
      return { ...s, notice: null };
    case "restorationField":
      return withRestoration(s, { ...r, [a.field]: a.value });
    case "toggleTooth":
      return withRestoration(s, toggleTooth(r, a.tooth));
    case "bridgeClick":
      return withRestoration(s, applyBridgeClick(r, a.tooth, a.role));
    case "unitRole":
      return withRestoration(s, setUnitRole(r, a.bridgeId, a.tooth, a.role));
    case "removeUnit":
      return withRestoration(s, removeUnit(r, a.bridgeId, a.tooth));
    case "newBridge":
      return withRestoration(s, startNewBridge(r));
    case "selectBridge":
      return withRestoration(s, { ...r, activeBridgeId: a.bridgeId });
    case "removeBridge":
      return withRestoration(s, removeBridge(r, a.bridgeId));
    case "toggleArch":
      return withRestoration(s, toggleArch(r, a.arch));
    case "setArches":
      return withRestoration(s, { ...r, arches: a.arches });
    case "clearSelection":
      return withRestoration(s, clearSelection(r));
    case "addFiles":
      return { ...s, draft: { ...s.draft, files: [...s.draft.files, ...a.files] } };
    case "removeFile":
      return { ...s, draft: { ...s.draft, files: s.draft.files.filter((f) => f.id !== a.id) } };
    case "fileCategory":
      return { ...s, draft: { ...s.draft, files: s.draft.files.map((f) => (f.id === a.id ? { ...f, category: a.category } : f)) } };
    case "instructions":
      return { ...s, draft: { ...s.draft, instructions: a.value } };
    case "goto": {
      // Leaving the restoration step drops empty bridge drafts.
      const restoration = s.step === 1 ? { ...r, bridges: r.bridges.filter((b) => b.units.length > 0) } : r;
      const activeBridgeId = restoration.bridges.some((b) => b.id === restoration.activeBridgeId) ? restoration.activeBridgeId : (restoration.bridges.at(-1)?.id ?? null);
      return {
        ...s,
        draft: { ...s.draft, restoration: { ...restoration, activeBridgeId } },
        step: a.step,
        furthest: Math.max(s.furthest, a.step),
        showErrors: false,
        notice: null,
        returnToReview: a.fromReview ?? (a.step === 3 ? false : s.returnToReview),
      };
    }
    case "showErrors":
      return { ...s, showErrors: true };
    case "loadDraft":
      return { ...initialState(), draft: a.draft, step: s.step, furthest: 3 };
    case "reset":
      return initialState();
  }
}
