// The consultation form's choices, taken from the clinic configuration.
// Imported by the form and by the Worker.

import { clinic } from "../../config/clinic";
import { enabledTreatments } from "../../config/treatments";
import { CONTACT_METHODS, type ConsultationOptions } from "./schema";

/** Default country for phone numbers: where the clinic is. */
export const CLINIC_COUNTRY = "US";

export const CONTACT_METHOD_LABELS: Record<string, string> = { call: "Phone call", text: "Text message", email: "Email" };

export function consultationOptions(): ConsultationOptions {
  return {
    treatments: enabledTreatments.map((t) => t.id),
    locations: clinic.locations.map((l) => l.id),
    contactMethods: [...CONTACT_METHODS],
  };
}

export const treatmentLabel = (id: string) => enabledTreatments.find((t) => t.id === id)?.name ?? "";
export const locationLabel = (id: string) => clinic.locations.find((l) => l.id === id)?.name ?? "";
