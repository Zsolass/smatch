// The connection point for a real case submission backend.
//
// The demo adapter below keeps everything in the browser: no case data or files
// leave the page. A production adapter would implement the same interface, for
// example by uploading `draft.files` and POSTing the work order to the lab's API,
// and be passed to <CaseSubmission adapter={...} />.

import type { CaseDraft } from "./model";

export interface SubmissionReceipt {
  caseId: string;
  submittedAt: Date;
}

export interface CaseSubmissionAdapter {
  /** True when files and data are sent to a lab; false for the local demo. */
  readonly sendsData: boolean;
  submit(draft: CaseDraft): Promise<SubmissionReceipt>;
}

const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function demoCaseId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `DEMO-${Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("")}`;
}

export const demoAdapter: CaseSubmissionAdapter = {
  sendsData: false,
  async submit() {
    // A short pause so the submit state is visible; nothing is sent anywhere.
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { caseId: demoCaseId(), submittedAt: new Date() };
  },
};
