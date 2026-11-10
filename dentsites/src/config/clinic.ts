// Everything about the clinic shown on the website, except the treatment pages
// (see treatments.ts). To personalise the site for a real clinic, change this
// file, treatments.ts and the assets in /public/clinic and /public/images; no
// component needs to be edited. Sections with no content are not rendered.
//
// Also imported by the Worker, so keep this file free of React and browser APIs.

export interface ClinicImage {
  /** Path prefix; files are `${src}-${width}.webp` for each width. */
  src: string;
  widths: number[];
  /** Intrinsic aspect ratio, width / height. */
  aspect: number;
  alt: string;
}

export const img = (name: string, widths: number[], aspect: number, alt: string): ClinicImage => ({
  src: `/images/${name}`,
  widths,
  aspect,
  alt,
});

export interface ClinicLocation {
  id: string;
  /** Shown when the clinic has more than one location. */
  name: string;
  address: string[];
  phone: string;
  phoneHref: string;
  email: string;
  hours: { days: string; time: string }[];
  /** One line for the bar above the header. */
  hoursSummary: string;
  parking: string | null;
  /** Link to a maps app. Only set for a real address. */
  directionsUrl: string | null;
}

export interface ResultCase {
  id: string;
  title: string;
  /** Treatment id from treatments.ts; the case links to that page. */
  treatment: string;
  treatmentLabel: string;
  concern: string;
  summary: string;
  before: ClinicImage;
  after: ClinicImage;
}

export interface PatientStory {
  quote: string;
  name: string;
  treatmentLabel: string;
}

export interface PatientVideo {
  title: string;
  /** Poster frame shown until the visitor presses play. */
  poster: ClinicImage;
  /** A video file (mp4/webm) served from /public, or an embed URL (YouTube, Vimeo). */
  src: string;
  kind: "file" | "embed";
}

export interface TeamMember {
  id: string;
  name: string;
  credentials: string;
  role: string;
  focus: string;
  bio: string;
  qualifications: string[];
  /** Portrait path under /public; null shows a placeholder. */
  photo: string | null;
  /** Clinicians assess and plan care and can be listed on treatment pages. */
  clinician: boolean;
}

export interface FeeStage {
  stage: string;
  label: string;
  amount: number;
  from?: boolean;
  includes: string;
}

export interface Fee {
  id: string;
  /** Treatment id from treatments.ts; omit for fees that belong to no single page. */
  treatment?: string;
  label: string;
  amount: number;
  /** Shown as "from $…" when the fee varies with the case. */
  from?: boolean;
  unit: string;
  includes: string;
  /** For staged treatment, the parts that make up `amount`. */
  stages?: FeeStage[];
  /** What happens between the stages, shown under them. */
  stagesNote?: string;
}

const PHONE = "+1 555 0142";

export const clinic = {
  name: "Smatch Demo Dental",
  descriptor: "Dental clinic · Demo City",
  /** Shown wherever the clinic’s details could be mistaken for a real business. */
  sampleNotice:
    "Smatch Demo Dental is a fictional clinic. Its team, cases, reviews, fees and contact details are sample content, and the cases are 3D illustrations rather than patient photographs.",
  /** Treatment and clinical wording is sample copy; a real clinic reviews it before publication. */
  clinicalNotice: "Sample treatment information for demonstration. A clinic reviews and approves its own clinical content before publication.",

  logo: { mark: "/clinic/logo-mark.svg", alt: "Smatch Demo Dental" },

  // Design tokens, exposed as CSS variables (see app/layout.tsx). Fonts are set in app/layout.tsx.
  colors: {
    paper: "#f7f2e8", // warm ivory
    paperDeep: "#ede5d6",
    surface: "#fffdf8",
    ink: "#22272a", // charcoal
    inkSoft: "#5b625f",
    line: "#dcd3c2",
    accent: "#1f4d3f", // deep green
    accentStrong: "#163a2f",
    accentSoft: "#dfe7d9",
    sage: "#a9b9a1", // muted sage accent
    night: "#13241f",
    nightSoft: "#1c342d",
    warm: "#b4744a",
  },

  // One entry per location. Location-specific details (and the location
  // question in the form) appear automatically when there are several.
  locations: [
    {
      id: "demo-city",
      name: "Demo City",
      address: ["24 Example Avenue", "Demo City, DC 00000"],
      phone: PHONE,
      phoneHref: "tel:+15550142",
      email: "hello@demo-dental.example",
      hours: [
        { days: "Monday – Wednesday", time: "8:00 am – 5:00 pm" },
        { days: "Thursday", time: "10:00 am – 7:00 pm" },
        { days: "Friday", time: "8:00 am – 3:00 pm" },
        { days: "Saturday", time: "By appointment" },
      ],
      hoursSummary: "Mon – Fri from 8 am · Thu until 7 pm",
      parking: "Free parking behind the clinic",
      directionsUrl: null,
    },
  ] satisfies ClinicLocation[] as ClinicLocation[],

  nav: [
    { label: "Treatments", href: "/#treatments" },
    { label: "Results", href: "/#results" },
    { label: "Our Team", href: "/#team" },
    { label: "Costs & Financing", href: "/#costs" },
    { label: "Contact", href: "/#contact" },
  ],

  hero: {
    eyebrow: "General, cosmetic & implant dentistry in Demo City",
    // *word* is set in the accent italic.
    title: "Dentistry that starts with *listening*.",
    description:
      "From routine check-ups to implants and full-arch treatment, one team plans your care with you. You see the options, the timing and the fees in writing before anything begins.",
    secondaryCta: { label: "Explore treatments", href: "/#treatments" },
    image: img("hero", [750, 1500], 4 / 5, "A 3D model of a healthy smile on a stone plinth in front of a deep green arch"),
    imageCaption: "Illustrative 3D render",
    points: ["New patients welcome", "Evening appointments on Thursdays", "Free parking behind the clinic"],
  },

  // Early trust signals. Remove an item (or set `rating` to null) to hide it.
  trust: {
    eyebrow: "Our approach",
    // One sentence on how the clinic works. *word* is set in the accent italic.
    statement: "We explain first, and treat only when *you are ready*.",
    /** Team member introduced as "your dentist" (id from team.members); null hides the card. */
    leadClinicianId: "maya-example" as string | null,
    items: [
      { title: "Seen by a dentist from the start", description: "Your consultation is with the clinician who would plan and carry out your treatment." },
      { title: "A written plan before you decide", description: "Options, sequence, timing and fees on paper, yours to take home and think over." },
      { title: "Digital scans and 3D imaging", description: "Most records are taken with a small camera, and you can follow them on screen." },
    ],
    /** Publish a rating only from genuine, verifiable reviews. */
    rating: { value: "4.9", outOf: "5", count: "Sample rating", source: "Your verified review score appears here" } as {
      value: string;
      outOf: string;
      count: string;
      source: string;
    } | null,
  },

  needs: {
    eyebrow: "Treatments",
    title: "What brings you in *today*?",
    description: "Start with what you have noticed. Each path explains the options in plain language, and every one begins with a conversation with a dentist.",
  },

  results: {
    eyebrow: "Results",
    title: "Before and after, *case by case*",
    description: "Move the slider, or use the Before and After buttons, to compare each case.",
    notice: "Sample cases: 3D illustrations, not patient photographs",
    cases: [
      {
        id: "single-implant",
        title: "A missing premolar",
        treatment: "dental-implants",
        treatmentLabel: "Single dental implant",
        concern: "A gap in the upper teeth after an extraction.",
        summary: "An implant replaced the root, and a ceramic crown was matched to the neighbouring teeth.",
        before: img("case-implant-before", [800, 1600], 4 / 3, "Before: 3D model of a smile with one upper premolar missing"),
        after: img("case-implant-after", [800, 1600], 4 / 3, "After: the same 3D model with the missing premolar replaced"),
      },
      {
        id: "full-arch",
        title: "Several failing upper teeth",
        treatment: "full-arch-implants",
        treatmentLabel: "Full-arch fixed bridge on implants",
        concern: "Missing, worn and loose upper teeth that could not be restored one by one.",
        summary: "The upper arch was rebuilt with a fixed bridge on implants: a provisional bridge first, then the final bridge after healing.",
        before: img("case-full-arch-before", [800, 1600], 4 / 3, "Before: 3D model of a smile with several upper teeth missing and the rest worn and discoloured"),
        after: img("case-full-arch-after", [800, 1600], 4 / 3, "After: the same 3D model with a complete, even upper arch"),
      },
      {
        id: "veneers",
        title: "Worn and discoloured front teeth",
        treatment: "veneers",
        treatmentLabel: "Whitening and porcelain veneers",
        concern: "Front teeth that had shortened and darkened over the years.",
        summary: "After whitening, six porcelain veneers restored the length and gave the front teeth an even shade.",
        before: img("case-veneers-before", [800, 1600], 4 / 3, "Before: 3D model of a smile with short, uneven, yellowed upper front teeth"),
        after: img("case-veneers-after", [800, 1600], 4 / 3, "After: the same 3D model with longer, even, lighter upper front teeth"),
      },
      {
        id: "aligners",
        title: "Crowded front teeth",
        treatment: "clear-aligners",
        treatmentLabel: "Clear aligners",
        concern: "Overlapping upper and lower front teeth that were hard to clean.",
        summary: "A series of clear aligners made room and levelled the front teeth, followed by retainers to hold the result.",
        before: img("case-aligners-before", [800, 1600], 4 / 3, "Before: 3D model of a smile with rotated, overlapping front teeth"),
        after: img("case-aligners-after", [800, 1600], 4 / 3, "After: the same 3D model with the front teeth aligned"),
      },
    ] satisfies ResultCase[] as ResultCase[],
    storiesTitle: "In patients’ words",
    stories: [
      {
        quote: "Everything was explained before we started, including what it would cost. I never felt rushed into a decision.",
        name: "Sample patient",
        treatmentLabel: "Dental implant",
      },
      {
        quote: "I had put off going for years. The team was patient with my questions, and the plan finally made sense to me.",
        name: "Sample patient",
        treatmentLabel: "Full-arch treatment",
      },
      {
        quote: "Booking was easy and the reminders helped. Check-ups are no longer something I dread.",
        name: "Sample patient",
        treatmentLabel: "Routine care",
      },
    ] satisfies PatientStory[] as PatientStory[],
    /** Patient videos load only after the visitor presses play. None in the demo. */
    videos: [] as PatientVideo[],
  },

  team: {
    eyebrow: "Our team",
    title: "The people who will *look after you*",
    description:
      "Your consultation is with a dentist, and the same dentist plans and oversees your treatment. A treatment coordinator is your point of contact for appointments, estimates and questions between visits.",
    members: [
      {
        id: "maya-example",
        name: "Dr. Maya Example",
        credentials: "DDS",
        role: "Lead clinician",
        focus: "Implant and restorative dentistry",
        bio: "Dr. Example assesses and plans implant and full-arch cases, and carries out the surgical and restorative stages with the clinic’s team.",
        qualifications: ["Doctor of Dental Surgery, Sample University", "Postgraduate training in implant dentistry", "Licensed dentist, State of Demo"],
        photo: null,
        clinician: true,
      },
      {
        id: "daniel-sample",
        name: "Dr. Daniel Sample",
        credentials: "DMD",
        role: "Dentist",
        focus: "Cosmetic dentistry and clear aligners",
        bio: "Dr. Sample looks after general and cosmetic care, from first examinations to veneers and aligner treatment.",
        qualifications: ["Doctor of Dental Medicine, Sample University", "Certified clear aligner provider", "Licensed dentist, State of Demo"],
        photo: null,
        clinician: true,
      },
      {
        id: "priya-example",
        name: "Priya Example",
        credentials: "RDH",
        role: "Dental hygienist",
        focus: "Preventive care and gum health",
        bio: "Priya sees patients for hygiene visits and helps you keep implants, aligners and natural teeth clean at home.",
        qualifications: ["Registered dental hygienist, State of Demo"],
        photo: null,
        clinician: false,
      },
      {
        id: "jordan-sample",
        name: "Jordan Sample",
        credentials: "",
        role: "Treatment coordinator",
        focus: "Appointments, estimates and payment plans",
        bio: "Jordan arranges your visits, walks you through your written estimate and is the person to call with questions between appointments.",
        qualifications: [],
        photo: null,
        clinician: false,
      },
    ] satisfies TeamMember[] as TeamMember[],
  },

  firstVisit: {
    eyebrow: "Your first visit",
    title: "What happens, *step by step*",
    steps: [
      { title: "Request your consultation", description: "Send the short form or call us. We contact you to agree a time that suits you." },
      {
        title: "Talk it through and be assessed",
        description: "Your dentist listens to your concerns, examines your teeth and gums, and takes any X-rays or scans that are needed.",
      },
      {
        title: "Review your plan",
        description: "You receive a written plan with the options, the likely sequence and timing, and the fees. There is no obligation to go ahead.",
      },
    ],
    note: "Allow about 45 minutes. The consultation fee and what it includes are listed under Costs & Financing.",
  },

  costs: {
    eyebrow: "Costs & financing",
    title: "Clear fees, *before you decide*",
    description: "Your written plan lists every fee before treatment starts. These guide prices show what to expect.",
    notice: "Sample fees for demonstration. A clinic’s own fees, inclusions and finance terms appear here.",
    consultation: {
      label: "Consultation",
      amount: 95,
      unit: "per visit",
      duration: "About 45 minutes with a dentist",
      includes: ["Examination of your teeth, gums and bite", "X-rays or a digital scan when needed for your plan", "A written treatment plan and estimate to take home"],
      note: "The consultation fee is separate from treatment fees.",
    },
    fees: [
      { id: "new-patient", treatment: "general-dentistry", label: "New-patient examination and hygiene visit", amount: 210, unit: "per visit", includes: "Examination, routine X-rays, scale and polish." },
      { id: "filling", treatment: "general-dentistry", label: "Tooth-coloured filling", amount: 190, from: true, unit: "per tooth", includes: "Depends on the size of the filling." },
      { id: "emergency", treatment: "emergency-care", label: "Emergency appointment", amount: 145, unit: "per visit", includes: "Assessment and an X-ray of the area. Any treatment is quoted before it starts." },
      { id: "whitening", treatment: "veneers", label: "Professional whitening", amount: 450, unit: "per course", includes: "Custom trays and whitening gel to use at home." },
      { id: "veneer", treatment: "veneers", label: "Porcelain veneer", amount: 1350, from: true, unit: "per tooth", includes: "Planning, a preview of the result, a temporary veneer and the final veneer." },
      { id: "aligners", treatment: "clear-aligners", label: "Clear aligner treatment", amount: 3400, from: true, unit: "per course", includes: "Records, treatment plan, aligners, review visits and a first set of retainers." },
      { id: "implant", treatment: "dental-implants", label: "Single implant with crown", amount: 3900, from: true, unit: "per tooth", includes: "Implant, abutment and ceramic crown. Bone grafting, if needed, is quoted separately." },
      {
        id: "full-arch",
        treatment: "full-arch-implants",
        label: "Full-arch fixed bridge on implants",
        amount: 21500,
        from: true,
        unit: "per arch",
        includes: "All three stages below, for one arch (upper or lower).",
        stagesNote: "Each stage is paid when it begins. Between the provisional stage and the final restoration there is a healing period of several months; the review visits during healing are included.",
        stages: [
          { stage: "Consultation and planning", label: "Planning and records", amount: 450, includes: "3D X-ray, digital scans, photographs and a preview of the planned teeth." },
          { stage: "Provisional stage", label: "Surgery and provisional bridge", amount: 14500, from: true, includes: "Implant placement, any extractions in that arch and a fixed provisional bridge." },
          { stage: "Final restoration", label: "Final bridge", amount: 6550, from: true, includes: "New scans after healing, a try-in and the final bridge." },
        ],
      },
    ] satisfies Fee[] as Fee[],
    /** Shown only when the clinic offers it. Set to null to hide the block. */
    financing: {
      title: "Payment and financing",
      options: [
        { title: "Monthly payment plans", description: "Spread the cost of treatment over 6 to 24 months through our finance partner, subject to application and approval. You receive the terms in writing before you decide." },
        { title: "Dental insurance", description: "We give you an itemised estimate to check against your plan and help you submit your claim." },
        { title: "Ways to pay", description: "Major credit and debit cards, and HSA or FSA cards. Staged treatment is paid stage by stage." },
      ],
    } as { title: string; options: { title: string; description: string }[] } | null,
  },

  technology: {
    eyebrow: "The clinic",
    title: "A calm clinic, *carefully equipped*",
    description: "Private treatment rooms, step-free access and a team that explains what each piece of equipment is for.",
    image: img("tech-scan", [800, 1600], 4 / 3, "A 3D model of teeth shown half as a finished surface and half as a digital scan mesh"),
    imageCaption: "A digital scan becomes a 3D model of your teeth",
    items: [
      { title: "Digital scans", description: "A small camera records the shape of your teeth in a few minutes, in place of impression trays for most treatment. You see the 3D model on screen while your dentist explains it." },
      { title: "3D X-ray imaging", description: "For implant treatment, a 3D X-ray shows the bone and nearby structures, so the position of each implant is planned before the day of surgery." },
      { title: "A preview before you commit", description: "For cosmetic and aligner treatment, a digital preview helps you and your dentist agree on the goal before anything is changed." },
    ],
    /** Only for clinics that have their own laboratory. Set `enabled` to false to hide it. */
    inHouseLab: {
      enabled: true,
      title: "An in-house dental laboratory",
      description: "Crowns, provisional bridges and aligner models are made on site by our own technicians, so shade and fit can be checked and adjusted while you are here.",
      image: img("tech-lab", [700, 1400], 4 / 3, "Four ceramic crowns on a sage green plate"),
    },
  },

  faq: [
    {
      q: "What happens at my first appointment?",
      a: "You talk through your concerns with a dentist, who examines your teeth and gums and takes any X-rays or scans that are needed. You leave with a written plan that sets out your options, the likely timing and the fees.",
    },
    {
      q: "How do I find out which treatment is suitable for me?",
      a: "That is what the consultation is for. The treatment pages on this site explain the usual options, and your dentist will tell you which of them suit your teeth, your health and what matters to you.",
    },
    {
      q: "What does the consultation cost?",
      a: "A consultation is $95. It includes the examination, any X-rays or digital scan needed for your plan, and a written treatment plan and estimate. Treatment fees are separate and are always quoted beforehand.",
    },
    {
      q: "What payment or financing options are available?",
      a: "You can pay by card, including HSA and FSA cards, and staged treatment is paid stage by stage. Monthly payment plans are available through our finance partner, subject to approval. We also provide itemised estimates for insurance claims.",
    },
    {
      q: "Where is the clinic and where can I park?",
      a: "We are at 24 Example Avenue in Demo City, with free parking behind the building and step-free access from the car park.",
    },
    {
      q: "How do I contact the team?",
      a: `Call ${PHONE} during opening hours, or send the consultation form at any time and we will contact you. If you are in pain, please call so we can advise you straight away.`,
    },
    {
      q: "Is this a real clinic?",
      a: "No. Smatch Demo Dental is a fictional clinic that shows what a clinic’s own website could look like. The consultation form is a demo: nothing you enter is sent to a clinic, and no appointment is booked.",
    },
  ],

  contact: {
    eyebrow: "Contact",
    title: "Ready when *you are*",
    description: "Send a short request and we will contact you to arrange your consultation. Prefer to talk? Call us during opening hours.",
  },

  seo: {
    title: "Smatch Demo Dental · Dental clinic in Demo City (demo)",
    description:
      "A demo dental clinic website by Smatch: treatments explained by patient need, before-and-after cases, the team, fees and financing, and a consultation request form.",
    ogImage: "/og-image.png",
  },
};

export type Clinic = typeof clinic;

/** The clinic’s main (first) location: used for the header, call links and the footer. */
export const mainLocation = clinic.locations[0]!;
export const hasMultipleLocations = clinic.locations.length > 1;
