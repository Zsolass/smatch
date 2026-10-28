// Client-side checks for files added to the case demo. Nothing is uploaded.
import { fileRules, type FileCategory } from "@/config/case-submission";

export interface FileLike {
  name: string;
  size: number;
}

export interface Rejection {
  name: string;
  reason: string;
}

export interface FileCheck<T extends FileLike> {
  accepted: T[];
  rejected: Rejection[];
}

export type FileRules = typeof fileRules;

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / 1024 / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

export function formatList(rules: FileRules = fileRules): string {
  const shown = rules.extensions.filter((e) => e !== "jpeg").map((e) => (e === "jpg" ? "JPG/JPEG" : e.toUpperCase()));
  return `${shown.slice(0, -1).join(", ")} or ${shown.at(-1)}`;
}

const key = (f: FileLike) => `${f.name.toLowerCase()}::${f.size}`;

/**
 * Splits a batch of dropped/selected files into accepted and rejected ones.
 * Valid files are accepted even when other files in the same batch fail.
 */
export function checkIncomingFiles<T extends FileLike>(incoming: T[], existing: FileLike[], rules: FileRules = fileRules): FileCheck<T> {
  const accepted: T[] = [];
  const rejected: Rejection[] = [];
  const seen = new Set(existing.map(key));
  let count = existing.length;
  let total = existing.reduce((sum, f) => sum + f.size, 0);

  for (const file of incoming) {
    const ext = extensionOf(file.name);
    let reason: string | null = null;
    if (!rules.extensions.includes(ext)) {
      reason = `${ext ? `.${ext.toUpperCase()} files aren't` : "Files without an extension aren't"} supported. Use ${formatList(rules)}.`;
    } else if (file.size === 0) {
      reason = "The file is empty (0 bytes).";
    } else if (file.size > rules.maxFileBytes) {
      reason = `The file is ${formatBytes(file.size)}; the limit is ${formatBytes(rules.maxFileBytes)} per file.`;
    } else if (seen.has(key(file))) {
      reason = "This file is already attached.";
    } else if (count >= rules.maxFiles) {
      reason = `A case can have up to ${rules.maxFiles} files.`;
    } else if (total + file.size > rules.maxTotalBytes) {
      reason = `Adding it would take the case over ${formatBytes(rules.maxTotalBytes)} in total.`;
    }
    if (reason) {
      rejected.push({ name: file.name, reason });
      continue;
    }
    accepted.push(file);
    seen.add(key(file));
    count += 1;
    total += file.size;
  }
  return { accepted, rejected };
}

const IMAGE = ["jpg", "jpeg", "png"];

/** Best guess from the file name; the user can always change it. */
export function suggestCategory(name: string): FileCategory {
  const ext = extensionOf(name);
  const base = name.toLowerCase();
  if (IMAGE.includes(ext)) return "Photos";
  if (ext === "pdf") return /(rx|prescription|order|slip|form)/.test(base) ? "Prescription" : "Other";
  if (/(bite|occlus|interocclusal|registration|bukkal|buccal)/.test(base)) return "Bite scan";
  if (/(upper|maxill|\bup\b|[-_ .]u[-_ .]|oberkiefer|felso)/.test(base)) return "Upper scan";
  if (/(lower|mandib|\blow\b|[-_ .]l[-_ .]|unterkiefer|also)/.test(base)) return "Lower scan";
  return "Other";
}

export function isImage(name: string): boolean {
  return IMAGE.includes(extensionOf(name));
}
