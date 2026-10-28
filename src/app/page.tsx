import { InquireSection } from "@/components/inquiry/InquireSection";
import { Benefits } from "@/components/marketing/Benefits";
import { ClosingCta } from "@/components/marketing/ClosingCta";
import { Contact } from "@/components/marketing/Contact";
import { Faq } from "@/components/marketing/Faq";
import { Gallery } from "@/components/marketing/Gallery";
import { Hero } from "@/components/marketing/Hero";
import { LabTechnology } from "@/components/marketing/LabTechnology";
import { Services } from "@/components/marketing/Services";
import { Workflow } from "@/components/marketing/Workflow";
import { DemoBanner } from "@/components/site/DemoBanner";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function HomePage() {
  return (
    <>
      <a href="#main" className="sr-only z-50 rounded-lg bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <DemoBanner />
      <SiteHeader />
      <main id="main">
        <Hero />
        <Services />
        <Gallery />
        <Workflow />
        <LabTechnology />
        <Benefits />
        <Faq />
        <Contact />
        <ClosingCta />
        <InquireSection />
      </main>
      <SiteFooter />
    </>
  );
}
