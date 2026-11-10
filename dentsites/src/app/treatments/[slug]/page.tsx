import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/PageShell";
import { TreatmentPage } from "@/components/treatment/TreatmentPage";
import { clinic, mainLocation } from "@/config/clinic";
import { enabledTreatments, findTreatment } from "@/config/treatments";

// One page per enabled treatment; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return enabledTreatments.map((t) => ({ slug: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const treatment = findTreatment((await params).slug);
  if (!treatment) return {};
  const title = `${treatment.seo.title} in ${mainLocation.name}`;
  return {
    title,
    description: treatment.seo.description,
    alternates: { canonical: `/treatments/${treatment.id}` },
    openGraph: { title: `${title} · ${clinic.name}`, description: treatment.seo.description, url: `/treatments/${treatment.id}` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const treatment = findTreatment((await params).slug);
  if (!treatment) notFound();
  return (
    <PageShell treatment={treatment.id}>
      <TreatmentPage treatment={treatment} />
    </PageShell>
  );
}
