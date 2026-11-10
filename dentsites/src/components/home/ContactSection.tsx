import { ConsultationForm } from "@/components/consultation/ConsultationForm";
import { LocationDetails } from "@/components/consultation/LocationDetails";
import { CallLink } from "@/components/site/BookingLink";
import { buttonClass } from "@/components/ui/Button";
import { SampleNotice } from "@/components/ui/SampleTag";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { clinic, hasMultipleLocations, mainLocation } from "@/config/clinic";

interface Props {
  /** Treatment id to preselect in the form. */
  treatment?: string;
  title?: string;
  description?: string;
  placement?: string;
}

/** The closing invitation: the consultation form beside the clinic's contact details. */
export function ContactSection({ treatment, title = clinic.contact.title, description = clinic.contact.description, placement = "contact" }: Props) {
  return (
    <section id="contact" aria-labelledby="contact-title" className="border-t border-line/80 bg-paper-deep/70 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.25fr] lg:gap-16 lg:px-8">
        <div>
          <SectionHeading id="contact-title" eyebrow={clinic.contact.eyebrow} title={title} description={description} />
          <div className="mt-10" data-reveal>
            <LocationDetails />
            <div className="mt-8 flex flex-wrap gap-3">
              <CallLink placement="contact" label="call" />
              {!hasMultipleLocations && mainLocation.directionsUrl && (
                <a href={mainLocation.directionsUrl} target="_blank" rel="noopener" className={buttonClass("secondary")}>
                  Get directions<span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </div>
            <SampleNotice className="mt-8">{clinic.sampleNotice}</SampleNotice>
          </div>
        </div>
        <div data-reveal>
          <ConsultationForm initialTreatment={treatment} placement={placement} />
        </div>
      </div>
    </section>
  );
}
