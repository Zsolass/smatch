"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { Field, inputProps } from "@/components/ui/FormField";
import { fileCategories, fileRules, type FileCategory } from "@/config/case-submission";
import { newId, type CaseFile, type FieldErrors } from "@/lib/case-submission/model";
import type { Action } from "@/lib/case-submission/reducer";
import { checkIncomingFiles, extensionOf, formatBytes, formatList, isImage, suggestCategory, type Rejection } from "@/lib/files";
import { ErrorText } from "./RestorationStep";

interface Props {
  files: CaseFile[];
  instructions: string;
  errors: FieldErrors;
  dispatch: (a: Action) => void;
  onRemove: (file: CaseFile) => void;
}

const accept = fileRules.extensions.map((e) => `.${e}`).join(",");

export function FilesStep({ files, instructions, errors, dispatch, onRemove }: Props) {
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<Rejection[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const depth = useRef(0);
  const input = useRef<HTMLInputElement>(null);

  // Dropping a file just outside the zone shouldn't make the browser open it.
  useEffect(() => {
    const prevent = (e: globalThis.DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
    };
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  function add(list: FileList | File[]) {
    const incoming = Array.from(list);
    if (incoming.length === 0) return;
    const { accepted, rejected: rej } = checkIncomingFiles(incoming, files.map((f) => f.file));
    const items: CaseFile[] = accepted.map((file) => ({
      id: newId("file"),
      file,
      category: suggestCategory(file.name),
      previewUrl: isImage(file.name) ? URL.createObjectURL(file) : null,
    }));
    if (items.length) dispatch({ type: "addFiles", files: items });
    setRejected(rej);
    const parts = [];
    if (items.length) parts.push(`${items.length} ${items.length === 1 ? "file" : "files"} added`);
    if (rej.length) parts.push(`${rej.length} ${rej.length === 1 ? "file was" : "files were"} not added`);
    setAnnouncement(`${parts.join(". ")}.`);
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    add(e.dataTransfer.files);
  };

  const total = files.reduce((sum, f) => sum + f.file.size, 0);

  return (
    <div className="grid grid-cols-1 gap-6">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          depth.current += 1;
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={() => {
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setDragging(false);
        }}
        onDrop={onDrop}
        data-testid="dropzone"
        data-dragging={dragging || undefined}
        className={`relative flex flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed px-6 py-10 text-center transition-colors sm:py-14 ${
          dragging ? "border-accent bg-accent-soft/70" : errors.files ? "border-danger/60 bg-danger-soft/40" : "border-ink/20 bg-white hover:border-accent/50"
        }`}
      >
        <span className={`grid size-14 place-items-center rounded-2xl transition-colors ${dragging ? "bg-accent text-white" : "bg-accent-soft text-accent"}`}>
          <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 15.5V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
          </svg>
        </span>
        <p className="mt-4 text-lg font-semibold text-ink">{dragging ? "Drop to add the files" : "Drag and drop scans, photos and documents"}</p>
        <p className="mt-1 text-sm text-ink-soft">or</p>
        <button
          id="case-files"
          type="button"
          onClick={() => input.current?.click()}
          className="mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-night px-5 text-sm font-medium text-white hover:bg-night-soft"
          aria-describedby="file-rules"
        >
          Browse files
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = "";
          }}
        />
        <p id="file-rules" className="mt-5 max-w-md text-xs leading-relaxed text-ink-soft">
          {formatList()} · up to {fileRules.maxFiles} files · {formatBytes(fileRules.maxFileBytes)} per file · {formatBytes(fileRules.maxTotalBytes)} in total.
          <br />
          Files stay in your browser for this demo; nothing is uploaded.
        </p>
      </div>
      {errors.files && <ErrorText id="case-files-error">{errors.files}</ErrorText>}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {rejected.length > 0 && (
        <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-danger">
              {rejected.length === 1 ? "1 file wasn't added" : `${rejected.length} files weren't added`}
            </p>
            <button type="button" onClick={() => setRejected([])} className="text-xs text-ink-soft underline underline-offset-2 hover:text-ink">
              Dismiss
            </button>
          </div>
          <ul className="mt-2 grid gap-1">
            {rejected.map((r, i) => (
              <li key={`${r.name}-${i}`} className="text-ink">
                <span className="font-medium break-all">{r.name}</span>: <span className="text-ink-soft">{r.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {files.length > 0 && (
        <div>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="font-semibold text-ink">Attached files</h3>
            <p className="text-sm text-ink-soft">
              {files.length} of {fileRules.maxFiles} · {formatBytes(total)} of {formatBytes(fileRules.maxTotalBytes)}
            </p>
          </div>
          <ul className="grid gap-2">
            {files.map((f) => (
              <FileRow key={f.id} file={f} onCategory={(category) => dispatch({ type: "fileCategory", id: f.id, category })} onRemove={() => onRemove(f)} />
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-soft">Categories are suggested from file names. Check them before you continue.</p>
        </div>
      )}

      <Field id="case-instructions" label="Instructions for the lab" hint="Optional">
        <textarea
          {...inputProps("case-instructions")}
          rows={5}
          placeholder="Design wishes, contacts, occlusion, characterisation, anything the lab should know."
          value={instructions}
          onChange={(e) => dispatch({ type: "instructions", value: e.target.value })}
          maxLength={3000}
        />
      </Field>
    </div>
  );
}

const TYPE_STYLE: Record<string, string> = {
  stl: "bg-accent-soft text-accent-strong",
  ply: "bg-accent-soft text-accent-strong",
  obj: "bg-accent-soft text-accent-strong",
  zip: "bg-[#f6ead9] text-[#8a5a1f]",
  pdf: "bg-[#f8e3e1] text-[#9b2c22]",
};

function FileRow({ file, onCategory, onRemove }: { file: CaseFile; onCategory: (c: FileCategory) => void; onRemove: () => void }) {
  const ext = extensionOf(file.file.name);
  const selectId = `category-${file.id}`;
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-3 sm:flex-nowrap">
      <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-paper">
        {file.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
          <img src={file.previewUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className={`grid size-full place-items-center text-[0.68rem] font-bold tracking-wide uppercase ${TYPE_STYLE[ext] ?? "bg-paper text-ink-soft"}`} aria-hidden="true">
            {ext}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 basis-40">
        <p className="truncate text-sm font-medium text-ink" title={file.file.name}>
          {file.file.name}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-soft">
          <span>{formatBytes(file.file.size)}</span>
          <span aria-hidden="true">·</span>
          <span className="uppercase">{ext}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 font-medium text-accent-strong">
            <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Ready
          </span>
        </p>
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <label htmlFor={selectId} className="sr-only">
          Category for {file.file.name}
        </label>
        <select id={selectId} value={file.category} onChange={(e) => onCategory(e.target.value as FileCategory)} className="min-w-0 flex-1 rounded-lg border border-line bg-paper/60 px-2.5 py-2 text-sm sm:w-40 sm:flex-none">
          {fileCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="button" onClick={onRemove} className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-danger-soft hover:text-danger" aria-label={`Remove ${file.file.name}`}>
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </li>
  );
}
