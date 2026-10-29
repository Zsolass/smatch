// "Load example case": a fictional practice and a 13–15 zirconia bridge.
import { exampleFiles } from "@/config/case-submission";
import { isImage, suggestCategory } from "@/lib/files";
import { addDays, newId, todayIso, type CaseDraft, type CaseFile } from "./model";

export async function loadExampleFiles(): Promise<CaseFile[]> {
  // The sample files are static assets of this site; fetching them sends no case data.
  return Promise.all(
    exampleFiles.map(async (f) => {
      const res = await fetch(f.path);
      if (!res.ok) throw new Error(`Could not load ${f.path}`);
      const name = f.path.split("/").pop()!;
      const file = new File([await res.blob()], name, { type: f.type, lastModified: Date.now() });
      return {
        id: newId("file"),
        file,
        category: f.category ?? suggestCategory(name),
        previewUrl: isImage(name) ? URL.createObjectURL(file) : null,
      };
    }),
  );
}

export function exampleDraft(files: CaseFile[], today = todayIso()): CaseDraft {
  const bridgeId = newId("bridge");
  return {
    practice: {
      practiceName: "Northfield Dental Studio (demo)",
      dentistName: "Dr. Alex Sample",
      email: "dr.sample@northfield-dental.example",
      phone: "+1 555 0142",
      caseReference: "DEMO-001",
      dueDate: addDays(today, 14),
    },
    restoration: {
      workType: "bridge",
      material: "Monolithic zirconia",
      shade: "A2",
      notes: "Ovate pontic, light contacts.",
      teeth: [],
      bridges: [
        {
          id: bridgeId,
          units: [
            { tooth: 13, role: "abutment" },
            { tooth: 14, role: "pontic" },
            { tooth: 15, role: "abutment" },
          ],
        },
      ],
      activeBridgeId: bridgeId,
      arches: [],
    },
    files,
    instructions:
      "Sample case: three-unit zirconia bridge 13–15 with 14 as pontic. Please keep the canine guidance and match the shade photo. Call the practice if the margins on 15 need clarifying.",
  };
}
