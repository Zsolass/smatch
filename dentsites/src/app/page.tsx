import { ContactSection } from "@/components/home/ContactSection";
import { Costs } from "@/components/home/Costs";
import { Faq } from "@/components/home/Faq";
import { FirstVisit } from "@/components/home/FirstVisit";
import { Hero } from "@/components/home/Hero";
import { NeedCards } from "@/components/home/NeedCards";
import { Results } from "@/components/home/Results";
import { Team } from "@/components/home/Team";
import { Technology } from "@/components/home/Technology";
import { TrustStrip } from "@/components/home/TrustStrip";
import { PageShell } from "@/components/site/PageShell";
import { clinic } from "@/config/clinic";

// The patient journey, in order: is this clinic relevant, can they help, why
// trust them, what the first visit involves, what it costs, how to take the
// next step. Booking and calling stay within reach throughout.
export default function HomePage() {
  return (
    <PageShell>
      <Hero />
      <TrustStrip />
      <NeedCards />
      <Results />
      <Team />
      <FirstVisit />
      <Costs />
      <Technology />
      <Faq title="Questions, *answered*" items={clinic.faq}>
        <p>
          Something else on your mind?{" "}
          <a href="#contact" className="font-semibold text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent">
            Ask the team
          </a>
          .
        </p>
      </Faq>
      <ContactSection />
    </PageShell>
  );
}
