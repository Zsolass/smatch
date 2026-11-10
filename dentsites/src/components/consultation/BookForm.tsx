"use client";

import { useSearchParams } from "next/navigation";
import { ConsultationForm } from "./ConsultationForm";

/** The consultation form with the treatment taken from /book?treatment=<id>. */
export function BookForm() {
  const treatment = useSearchParams().get("treatment") ?? undefined;
  // Keyed so that arriving with another treatment selects it.
  return <ConsultationForm key={treatment ?? "none"} initialTreatment={treatment} placement="book-page" />;
}
