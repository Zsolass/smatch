import { clinic } from "@/config/clinic";
import { siteConfig } from "@/config/site";

/**
 * Business details for search engines (schema.org Dentist). Emitted only when
 * `structuredData` is switched on, which is for real, verified clinic details:
 * never for the fictional demo.
 */
export function StructuredData() {
  if (!siteConfig.structuredData || siteConfig.demo || siteConfig.noindex) return null;
  const data = clinic.locations.map((loc) => ({
    "@context": "https://schema.org",
    "@type": "Dentist",
    name: clinic.locations.length > 1 ? `${clinic.name}, ${loc.name}` : clinic.name,
    url: siteConfig.url,
    telephone: loc.phone,
    email: loc.email,
    address: { "@type": "PostalAddress", streetAddress: loc.address[0], addressLocality: loc.address.slice(1).join(", ") },
    openingHours: loc.hours.map((h) => `${h.days} ${h.time}`),
  }));
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
