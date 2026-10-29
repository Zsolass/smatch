// Everything about the lab shown on the demo website. To personalise the site
// for a real lab, change this file and the assets in /public/lab and
// /public/images; no component needs to be edited.

import { fileRules, workTypes, type WorkTypeId } from "./case-submission";

export interface LabImage {
  /** Path prefix; files are `${src}-${width}.webp` for each width. */
  src: string;
  widths: number[];
  /** Intrinsic aspect ratio, width / height. */
  aspect: number;
  alt: string;
}

export interface LabService {
  id: string;
  title: string;
  summary: string;
  description: string;
  includes: string[];
  materials: string[];
  sendInfo: string[];
  caseActions: { label: string; workType: WorkTypeId }[];
  image: LabImage;
}

export interface LabCase {
  id: string;
  title: string;
  workType: string;
  material: string;
  teeth: string;
  description: string;
  image: LabImage;
}

const img = (name: string, widths: number[], aspect: number, alt: string): LabImage => ({
  src: `/images/${name}`,
  widths,
  aspect,
  alt,
});

const formats = fileRules.extensions.filter((e) => e !== "jpeg").map((e) => e.toUpperCase());
const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

export const lab = {
  name: "Smatch Demo Lab",
  descriptor: "Digital dental laboratory",
  /** Shown wherever the lab's details could be mistaken for a real business. */
  sampleNotice: "Smatch Demo Lab is a fictional laboratory. All lab details, cases and contact information on this site are sample content.",

  logo: { mark: "/lab/logo-mark.svg", alt: "Smatch Demo Lab" },

  // Brand colours are exposed as CSS variables (see app/layout.tsx).
  colors: {
    paper: "#f7f5f0",
    paperDeep: "#efebe3",
    ink: "#22272b",
    inkSoft: "#596067",
    line: "#ddd7cc",
    accent: "#0d6b70",
    accentStrong: "#09525a",
    accentSoft: "#dcecea",
    highlight: "#67d6d3",
    night: "#0e1f23",
    nightSoft: "#16323a",
    warm: "#c98a4b",
  },

  contact: {
    email: "cases@demo-lab.example",
    phone: "+1 555 0100",
    phoneHref: "tel:+15550100",
    address: ["12 Example Street", "Demo City, DC 00000"],
    hours: "Monday–Friday, 8:00–17:00",
  },

  nav: [
    { label: "Services", href: "/#services" },
    { label: "Our Work", href: "/#work" },
    { label: "Digital Workflow", href: "/#workflow" },
    { label: "About", href: "/#about" },
    { label: "Contact", href: "/#contact" },
  ],

  hero: {
    eyebrow: "Digital dental laboratory",
    // *word* is set in the accent serif.
    title: "Precision *crafted*. Digitally *connected*.",
    description:
      "Crowns, bridges, implant restorations and removables, designed and finished in-house. Send scans and instructions online and work with a lab team that keeps you informed at every step.",
    image: img("hero", [800, 1400], 1, "A full-arch restoration on a gingiva model, half finished ceramic and half digital design mesh"),
    points: ["Open STL, PLY and OBJ scans", "Case review before design", "Courier delivery with every case"],
  },

  services: [
    {
      id: "crowns-bridges",
      title: "Crowns & Bridges",
      summary: "Single crowns and multi-unit bridges with precise margins, natural contacts and stable occlusion.",
      description:
        "From single posterior crowns to long-span anterior bridges, every restoration is designed against your scan and checked for margin fit, contacts and occlusion before it is finished by hand.",
      includes: ["Single-unit crowns", "Multi-unit bridges", "Maryland and cantilever designs on request", "Provisional crowns and bridges"],
      materials: ["Monolithic zirconia", "Layered zirconia", "Lithium disilicate", "PFM", "Full-cast gold"],
      sendInfo: ["Upper and lower scans with a bite scan", "Shade and photos for aesthetic cases", "Abutment and pontic positions for bridges"],
      caseActions: [
        { label: "Send a crown case", workType: "crown" },
        { label: "Send a bridge case", workType: "bridge" },
      ],
      image: img("service-crowns-bridges", [600, 1200], 4 / 3, "A three-unit zirconia bridge next to a single molar crown"),
    },
    {
      id: "implants",
      title: "Implant Restorations",
      summary: "Screw-retained and cemented implant crowns and bridges on stock or custom abutments.",
      description:
        "Send your scan with scan bodies in place and we design the abutment and restoration together, so the emergence profile, screw channel and contacts are planned as one.",
      includes: ["Screw-retained crowns", "Crowns on Ti-base", "Custom abutments", "Implant-supported bridges"],
      materials: ["Zirconia on Ti-base", "Screw-retained zirconia", "Custom titanium abutments", "PFM on custom abutments"],
      sendInfo: ["Scan with scan bodies and the implant system details", "Opposing arch and bite", "Soft-tissue scan if available"],
      caseActions: [{ label: "Send an implant case", workType: "implant" }],
      image: img("service-implants", [600, 1200], 4 / 3, "An exploded implant restoration: fixture, gold-coloured abutment and crown"),
    },
    {
      id: "full-arch",
      title: "Full-Arch Solutions",
      summary: "Implant-supported full-arch prostheses, from PMMA provisionals to definitive zirconia.",
      description:
        "Full-arch cases are planned with you step by step: records, try-in and definitive design. We keep the digital record of each stage, so a provisional can become the blueprint for the final restoration.",
      includes: ["Fixed full-arch prostheses", "Provisional PMMA arches", "Try-ins and verification jigs", "Hybrid restorations on titanium bars"],
      materials: ["Zirconia", "PMMA", "Titanium bar with acrylic"],
      sendInfo: ["Scans with multi-unit scan bodies", "Bite registration and photos", "Existing denture or provisional scan, if available"],
      caseActions: [{ label: "Send a full-arch case", workType: "full-arch" }],
      image: img("service-full-arch", [600, 1200], 4 / 3, "A full-arch restoration above four implants"),
    },
    {
      id: "veneers",
      title: "Veneers",
      summary: "Minimal-prep and conventional veneers, shaded to your photos and instructions.",
      description:
        "Veneers are designed from your scan and photos, with attention to length, texture and translucency. Send a smile design or wax-up request with the case and we will match it.",
      includes: ["Conventional veneers", "Minimal-prep veneers", "Diagnostic wax-ups and mock-ups"],
      materials: ["Lithium disilicate", "Feldspathic porcelain", "Composite"],
      sendInfo: ["Prep scan and opposing arch", "Shade photos with a shade tab", "Smile photos and any design notes"],
      caseActions: [{ label: "Send a veneer case", workType: "veneer" }],
      image: img("service-veneers", [600, 1200], 4 / 3, "Four ceramic veneers for the upper front teeth"),
    },
    {
      id: "dentures",
      title: "Digital Dentures",
      summary: "Complete dentures designed digitally, milled or printed, with try-ins along the way.",
      description:
        "Digital dentures keep a precise record of every design, so try-ins, adjustments and future remakes start from the same data instead of starting over.",
      includes: ["Complete dentures", "Try-in dentures", "Immediate dentures", "Digital denture records for remakes"],
      materials: ["Milled PMMA", "Printed denture resin"],
      sendInfo: ["Edentulous scans or impressions", "Bite registration", "Tooth shade and mould preferences"],
      caseActions: [{ label: "Send a denture case", workType: "denture" }],
      image: img("service-dentures", [600, 1200], 4 / 3, "A complete denture with pink acrylic base and palate"),
    },
    {
      id: "splints",
      title: "Splints & Guards",
      summary: "Occlusal splints and night guards in hard, dual-laminate and soft materials.",
      description:
        "Splints and guards are designed on your scan with the occlusal scheme you specify, then milled, printed or thermoformed and polished for comfort.",
      includes: ["Occlusal splints", "Night guards", "Sports guards"],
      materials: ["Hard acrylic", "Hard/soft dual laminate", "Soft thermoformed"],
      sendInfo: ["Upper and lower scans", "Bite registration at the desired opening", "Design notes (coverage, thickness, guidance)"],
      caseActions: [{ label: "Send a splint case", workType: "splint" }],
      image: img("service-splints", [600, 1200], 4 / 3, "A clear occlusal splint on a stone model"),
    },
  ] satisfies LabService[],

  cases: [
    {
      id: "bridge-13-15",
      title: "Three-unit bridge",
      workType: "Bridge",
      material: "Monolithic zirconia",
      teeth: "13–15",
      description: "Canine and second premolar abutments with a premolar pontic.",
      image: img("case-bridge", [800, 1600], 4 / 3, "Three-unit zirconia bridge from canine to second premolar"),
    },
    {
      id: "implant-36",
      title: "Implant crown",
      workType: "Implant Restoration",
      material: "Zirconia on Ti-base",
      teeth: "36",
      description: "Screw-retained molar crown with its abutment and fixture.",
      image: img("case-implant", [800, 1600], 4 / 3, "Molar implant crown above a gold-coloured abutment and implant fixture"),
    },
    {
      id: "veneers-12-22",
      title: "Anterior veneers",
      workType: "Veneers",
      material: "Lithium disilicate",
      teeth: "12–22",
      description: "Four veneers matched to the patient's natural incisal translucency.",
      image: img("case-veneers", [800, 1600], 4 / 3, "Four lithium disilicate veneers for the upper incisors"),
    },
    {
      id: "full-arch",
      title: "Full-arch restoration",
      workType: "Full-Arch Restoration",
      material: "Zirconia with gingiva-coloured ceramic",
      teeth: "Full arch",
      description: "Fixed full-arch prosthesis with characterised gingiva.",
      image: img("case-full-arch", [800, 1600], 4 / 3, "Full-arch restoration seen from above"),
    },
    {
      id: "denture",
      title: "Complete denture",
      workType: "Denture",
      material: "Milled PMMA",
      teeth: "Full arch",
      description: "Digitally designed complete denture with a polished palate.",
      image: img("case-denture", [800, 1600], 4 / 3, "Complete denture with pink base"),
    },
    {
      id: "splint",
      title: "Occlusal splint",
      workType: "Splint / Night Guard",
      material: "Hard acrylic",
      teeth: "Full arch",
      description: "Flat-plane splint with full occlusal coverage.",
      image: img("case-splint", [800, 1600], 4 / 3, "Clear occlusal splint seated on a stone model"),
    },
  ] satisfies LabCase[],

  workflow: [
    {
      title: "Scan & send",
      description: "Upload intraoral scans, photos and your prescription. Choose the restoration and mark the teeth on the chart.",
    },
    {
      title: "Lab review",
      description: "A technician reviews the case and contacts you if anything needs clarifying before design starts.",
    },
    {
      title: "Design & manufacture",
      description: "Restorations are designed in CAD, milled or printed, then finished, stained and glazed by hand.",
    },
    {
      title: "Delivery",
      description: "Your case leaves the lab with its work order, and the digital record stays on file for adjustments or remakes.",
    },
  ],

  about: {
    eyebrow: "Lab & technology",
    title: "Digital precision, finished by hand",
    paragraphs: [
      "We combine digital design with the judgement of experienced technicians. Every case is reviewed before design starts and checked against your instructions before it leaves the lab.",
      "Our team works with the files your practice already produces, so sending a case takes minutes, not a courier pick-up.",
    ],
    image: img("cad-design", [800, 1600], 4 / 3, "A molar crown shown half as finished ceramic and half as its CAD design mesh"),
    team: [
      { name: "Team member", role: "Lab manager", photo: null as string | null },
      { name: "Team member", role: "CAD/CAM technician", photo: null as string | null },
      { name: "Team member", role: "Ceramist", photo: null as string | null },
    ],
    process: [
      { title: "Scan intake", description: "STL, PLY and OBJ files from common intraoral scanners, plus photos and PDFs." },
      { title: "CAD design", description: "Margins, contacts and occlusion designed digitally against your scans." },
      { title: "Milling & printing", description: "Zirconia and glass-ceramics are milled; models, splints and try-ins are printed." },
      { title: "Finishing & checks", description: "Hand finishing, staining and glazing, then a final check against the work order." },
    ],
    equipment: ["Intraoral scan import", "Dental CAD software", "5-axis milling unit", "Resin 3D printer", "Sintering furnace", "Ceramic furnace"],
    commitments: ["Technician review of every case", "A named contact for questions", "Digital record kept for every case"],
  },

  benefits: [
    { title: "Clear communication", description: "One contact for your practice, and questions raised before design rather than after delivery." },
    { title: "Digital case handover", description: "Scans, photos and prescriptions arrive together, so nothing waits for a courier." },
    { title: "Detailed work orders", description: "Teeth, roles, materials and shades are captured in a structured order, not a handwritten slip." },
    { title: "Trackable coordination", description: "Each case has a reference, a requested date and a record of what was agreed." },
  ],

  faq: [
    {
      q: "Which files can I send?",
      a: `${formats.slice(0, -1).join(", ")} and ${formats.at(-1)} files: scans, ZIP archives, photos and PDF prescriptions. You can attach up to ${fileRules.maxFiles} files per case, up to ${mb(fileRules.maxFileBytes)} each and ${mb(fileRules.maxTotalBytes)} in total.`,
    },
    {
      q: "What information do you need with a case?",
      a: "Your practice and dentist details, a case reference or patient code (never the patient's name), the restoration, material and shade, the teeth or arch involved, your files and any instructions for the lab. The case form walks you through each step.",
    },
    {
      q: "Which restorations can I send?",
      a: `${workTypes.map((w) => w.label).join(", ")}. If your case doesn't fit these, choose the closest type and describe it in your instructions.`,
    },
    {
      q: "How do you coordinate with my practice?",
      a: "A technician reviews each case before design and contacts you if anything is unclear. Every case keeps its reference and your instructions, so both sides refer to the same record.",
    },
    {
      q: "How are finished cases delivered?",
      a: "Finished work is delivered by courier with its work order. The date you choose in the case form is your requested date; the lab confirms the delivery date once the case has been reviewed.",
    },
    {
      q: "Is this a real laboratory?",
      a: "No. Smatch Demo Lab is a fictional lab that shows what your own website could look like. The case form is a demo: nothing you enter or attach is sent to a laboratory.",
    },
  ],

  seo: {
    title: "Smatch Demo Lab · Digital dental laboratory (demo)",
    description:
      "A demo dental laboratory website by Smatch: services, sample cases, digital workflow and a hands-on case submission demo for dentists.",
    ogImage: "/og-image.png",
  },
};

export type Lab = typeof lab;
