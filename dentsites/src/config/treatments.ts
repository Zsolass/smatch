// Treatment pages. Every treatment uses the same page template
// (components/treatment/TreatmentPage.tsx); a page is built only for entries
// with `enabled: true`, and the patient-need cards, the consultation form and
// the fee table follow automatically.
//
// The wording here is sample content. Clinical statements for a real clinic
// must be supplied or reviewed by that clinic before publication.
//
// Also imported by the Worker, so keep this file free of React and browser APIs.

import { img, type ClinicImage } from "./clinic";

export interface TreatmentOption {
  title: string;
  description: string;
  /** When this option tends to be discussed, e.g. "Often considered when…". */
  suits?: string;
  /** A short "worth knowing" line shown under the description. */
  consider?: string;
}

/** A side-by-side comparison of the main options. One value per column in every row. */
export interface TreatmentComparison {
  title: string;
  columns: string[];
  rows: { label: string; values: string[] }[];
}

export interface TreatmentStep {
  title: string;
  description: string;
  /** Labels a step as part of a named stage, e.g. "Provisional stage". */
  stage?: string;
}

export interface Treatment {
  /** URL slug: /treatments/<id>. Also the value of "Treatment interest" in the form. */
  id: string;
  enabled: boolean;
  name: string;
  /** Short label for menus and the form. */
  shortName: string;
  /** The patient-need card on the homepage that leads here. */
  need: { title: string; description: string; icon: "tooth" | "arch" | "sparkle" | "align" | "urgent" | "care" };
  intro: string;
  image: ClinicImage;
  /** Shown above everything else, for situations that should not wait for a form. */
  urgentNotice?: string;
  concerns: string[];
  explanation: { title: string; paragraphs: string[] };
  /** The approaches a patient can discuss, including alternatives. */
  options: { title: string; description?: string; items: TreatmentOption[] }[];
  comparison?: TreatmentComparison;
  suitability: { title: string; intro: string; factors: string[] };
  /** Ids of cases from clinic.results.cases. */
  caseIds: string[];
  process: { title: string; steps: TreatmentStep[] };
  /** Ids of fees from clinic.costs.fees. */
  feeIds: string[];
  feeNote?: string;
  /** Ids of team members from clinic.team.members. */
  clinicianIds: string[];
  faq: { q: string; a: string }[];
  /**
   * The clinician who reviewed this page (id from clinic.team.members) and when,
   * e.g. { memberId: "maya-example", date: "March 2026" }. Leave unset until a
   * clinician really has reviewed the wording; the demo shows a sample notice instead.
   */
  reviewedBy?: { memberId: string; date: string };
  seo: { title: string; description: string };
}

export const treatments: Treatment[] = [
  {
    id: "dental-implants",
    enabled: true,
    name: "Dental implants",
    shortName: "Dental implant",
    need: {
      title: "I’m missing one tooth",
      description: "Ways to replace a single tooth, from an implant with a crown to a bridge.",
      icon: "tooth",
    },
    intro:
      "A dental implant replaces the root of a missing tooth and carries a crown that looks and works like a natural tooth. It is one of several ways to fill a gap, and your dentist will explain which of them suit you.",
    image: img("treat-implant", [700, 1400], 4 / 3, "An implant, its abutment and a ceramic crown shown apart and assembled"),
    concerns: [
      "A gap left by an extraction or an injury",
      "A tooth that cannot be saved and needs replacing",
      "A bridge or partial denture that no longer feels comfortable",
      "Difficulty chewing on one side",
      "Concern that neighbouring teeth are drifting into the space",
    ],
    explanation: {
      title: "How an implant works",
      paragraphs: [
        "An implant is a small titanium post placed in the jawbone where the root of the tooth used to be. Over a period of healing, the bone bonds to the implant.",
        "A connector, called an abutment, is then attached, and a crown made to match your other teeth is fitted on top. The implant does the work of the root; the crown is the part you see.",
      ],
    },
    options: [
      {
        title: "Options for replacing one tooth",
        items: [
          {
            title: "Implant with a crown",
            description: "Replaces the tooth without involving the teeth on either side.",
            suits: "Often considered when the teeth beside the gap are healthy.",
            consider: "Needs enough healthy bone and a period of healing before the final crown.",
          },
          {
            title: "Fixed bridge",
            description: "A replacement tooth held in place by crowns on the teeth either side of the gap.",
            suits: "Often considered when the neighbouring teeth already need crowns.",
            consider: "No surgery, but the supporting teeth are prepared to carry the bridge.",
          },
          {
            title: "Removable partial denture",
            description: "A small plate carrying one or more teeth, which you take out to clean.",
            suits: "Often considered as a temporary or lower-cost option.",
            consider: "Usually the quickest to make; some people find it less comfortable than a fixed tooth.",
          },
          {
            title: "Leaving the space",
            description: "Sometimes a reasonable choice, particularly for a back tooth.",
            consider: "Your dentist will explain what may change over time if the gap is left.",
          },
        ],
      },
    ],
    comparison: {
      title: "The options side by side",
      columns: ["Implant with a crown", "Fixed bridge", "Partial denture"],
      rows: [
        { label: "Neighbouring teeth", values: ["Left as they are", "Prepared to carry the bridge", "May carry clasps"] },
        { label: "Surgery", values: ["Yes", "No", "No"] },
        { label: "Fixed in place", values: ["Yes", "Yes", "No, removable"] },
        { label: "Usual time to finish", values: ["A few months", "A few weeks", "A few weeks"] },
        { label: "Guide cost", values: ["Higher", "Moderate", "Lower"] },
      ],
    },
    suitability: {
      title: "How we assess whether an implant suits you",
      intro: "Suitability is decided by a dentist after an examination. At your consultation we look at:",
      factors: [
        "The health of your gums and the neighbouring teeth",
        "The amount and quality of bone, usually with a 3D X-ray",
        "Your general health and any medication you take",
        "Habits that affect healing, such as smoking or tooth grinding",
        "What matters most to you: appearance, time, cost and upkeep",
      ],
    },
    caseIds: ["single-implant"],
    process: {
      title: "The stages of implant treatment",
      steps: [
        { title: "Consultation and planning", description: "Examination, a 3D X-ray where needed, and a written plan with the options and fees." },
        { title: "Placing the implant", description: "The implant is placed under local anaesthetic. You are told what to expect afterwards and how to look after the area." },
        { title: "Healing", description: "The bone bonds to the implant over a number of weeks or months. A temporary tooth can be discussed if the gap shows." },
        { title: "Fitting the crown", description: "A digital scan is taken, the crown is made to match your teeth, and it is fitted to the implant." },
        { title: "Review and upkeep", description: "A check after fitting, then regular examinations and hygiene visits, as for natural teeth." },
      ],
    },
    feeIds: ["implant"],
    feeNote: "Your estimate lists the implant, abutment and crown separately, along with any additional procedures your case needs.",
    clinicianIds: ["maya-example"],
    faq: [
      {
        q: "Is implant treatment painful?",
        a: "Implants are placed under local anaesthetic. Some tenderness and swelling afterwards is common for a few days. Your dentist will explain what to expect and how to manage it.",
      },
      {
        q: "How long does treatment take?",
        a: "It varies from person to person. Many single-implant treatments take a few months from placement to the final crown, because the bone needs time to heal. Your plan sets out the timing expected in your case.",
      },
      {
        q: "How long do implants last?",
        a: "With good cleaning and regular check-ups, implants can last for many years. Like natural teeth they need looking after, and the crown may need replacing in time.",
      },
      {
        q: "What if I don’t have enough bone?",
        a: "A 3D X-ray shows how much bone there is. If there is too little, your dentist may discuss bone grafting or an alternative such as a bridge.",
      },
    ],
    seo: {
      title: "Dental implants",
      description: "How a single dental implant works, the alternatives, how suitability is assessed, the stages of treatment and guide fees.",
    },
  },

  {
    id: "full-arch-implants",
    enabled: true,
    name: "Full-arch implants",
    shortName: "Full-arch implants",
    need: {
      title: "Several teeth are missing or failing",
      description: "Fixed and removable ways to rebuild a full set of teeth, explained stage by stage.",
      icon: "arch",
    },
    intro:
      "When most of the teeth in a jaw are missing or can no longer be saved, a full set of fixed teeth can be supported by a small number of implants. This page sets out the approaches, the stages and the fees, so you know what to ask at your consultation.",
    image: img("treat-full-arch", [700, 1400], 4 / 3, "A full arch of teeth above the four implants that support it"),
    concerns: [
      "Several loose, broken or missing teeth",
      "A denture that moves when you eat or speak",
      "Repeated work on teeth that keep failing",
      "Avoiding certain foods, or hiding your smile",
      "Being told elsewhere that your remaining teeth need to come out",
    ],
    explanation: {
      title: "What full-arch treatment involves",
      paragraphs: [
        "Full-arch treatment replaces all the teeth in one jaw with a single bridge fixed to implants. Usually four to six implants support the bridge.",
        "Treatment happens in stages. A provisional bridge is worn while the implants heal, and the final bridge is made once healing is complete. Each stage has its own appointments and its own fee, which are listed below.",
      ],
    },
    options: [
      {
        title: "Ways to replace a full arch",
        description: "Which of these are possible for you depends on your bone, your bite and your general health.",
        items: [
          {
            title: "Fixed bridge on four implants",
            description: "Four implants carry the bridge, with the back two angled to use the bone that is available.",
            suits: "Often considered when there is enough bone towards the front of the jaw.",
            consider: "Often possible without bone grafting. Depends on the bone and the forces of your bite.",
          },
          {
            title: "Fixed bridge on six implants",
            description: "Two further implants spread the load across the arch.",
            suits: "Often considered for the upper jaw, or for a heavy bite.",
            consider: "Sometimes advised for the upper jaw or a heavy bite. Needs enough bone further back.",
          },
          {
            title: "Removable denture held by implants",
            description: "A denture that clips onto two to four implants and is taken out for cleaning.",
            suits: "Often considered when a fixed bridge is not possible, or when cost is the priority.",
            consider: "Steadier than a conventional denture, with fewer implants than a fixed bridge.",
          },
          {
            title: "Conventional denture",
            description: "A removable denture supported by the gums, with no surgery.",
            suits: "Often considered when surgery is not suitable or not wanted.",
            consider: "How secure it feels varies from person to person, particularly in the lower jaw.",
          },
        ],
      },
      {
        title: "Materials for the final bridge",
        items: [
          {
            title: "Zirconia",
            description: "A strong ceramic milled as one piece, with a polished, stain-resistant surface.",
            consider: "Hard-wearing; repairs are less simple if it chips.",
          },
          {
            title: "Acrylic teeth on a titanium frame",
            description: "Acrylic teeth and gum-coloured acrylic carried by a milled titanium bar.",
            consider: "Lighter and easier to repair; the teeth wear and may need renewing over the years.",
          },
        ],
      },
    ],
    comparison: {
      title: "The options side by side",
      columns: ["Fixed bridge on implants", "Removable denture on implants", "Conventional denture"],
      rows: [
        { label: "Held in place by", values: ["Four to six implants", "Two to four implants", "The gums"] },
        { label: "Taken out to clean", values: ["No, cleaned in the mouth", "Yes, every day", "Yes, every day"] },
        { label: "Surgery", values: ["Yes", "Yes, usually less", "No"] },
        { label: "When eating", values: ["Stays fixed", "Clips in; slight movement", "Varies; may need adhesive"] },
        { label: "Guide cost", values: ["Highest", "Moderate", "Lowest"] },
      ],
    },
    suitability: {
      title: "How we assess your case",
      intro: "A full-arch plan is based on records taken at the consultation and planning visits. Your dentist considers:",
      factors: [
        "The volume of your jawbone and the position of nerves and sinuses, from a 3D X-ray",
        "The condition of any remaining teeth and of your gums",
        "Your general health, medication and how you heal",
        "Your bite, any grinding, and the space needed for the bridge",
        "What you expect in appearance, cleaning and long-term upkeep",
      ],
    },
    caseIds: ["full-arch"],
    process: {
      title: "The stages, from consultation to final teeth",
      steps: [
        {
          stage: "Consultation",
          title: "Consultation and records",
          description: "Examination, a 3D X-ray, photographs and digital scans. You receive a written plan with the suitable options and the fee for each stage.",
        },
        {
          stage: "Consultation",
          title: "Planning and preview",
          description: "The implant positions and the shape of the new teeth are planned digitally. You see and approve the planned result before surgery is booked.",
        },
        {
          stage: "Provisional stage",
          title: "Surgery and provisional bridge",
          description: "Any remaining teeth in the arch are removed and the implants are placed. A fixed provisional bridge is fitted when the implants are stable enough, which is confirmed on the day.",
        },
        {
          stage: "Provisional stage",
          title: "Healing",
          description: "The implants bond with the bone over several months. You follow a softer diet at first and attend review visits.",
        },
        {
          stage: "Final restoration",
          title: "Final bridge",
          description: "New scans are taken once healing is complete. After a try-in to check the bite and appearance, the final bridge is fitted.",
        },
        {
          stage: "Final restoration",
          title: "Looking after your bridge",
          description: "You are shown how to clean under the bridge, and attend regular hygiene and review visits.",
        },
      ],
    },
    feeIds: ["full-arch"],
    feeNote: "Fees are per arch (upper or lower). Your estimate states what each stage includes and when it is paid.",
    clinicianIds: ["maya-example"],
    faq: [
      {
        q: "Will I be without teeth at any point?",
        a: "The plan is designed so that you leave surgery with a fixed provisional bridge whenever the implants are stable enough. If that is not possible on the day, a temporary denture is provided while the implants heal. Your dentist will explain which is likely for you.",
      },
      {
        q: "Do I need four implants or six?",
        a: "It depends on your bone and your bite. Your dentist will recommend a number after studying your 3D X-ray, and will explain the reasons.",
      },
      {
        q: "Do all my remaining teeth have to be removed?",
        a: "Not necessarily. Where some teeth are healthy, your dentist may suggest keeping them and combining crowns on those teeth with implants where teeth are missing. This is decided from your examination and 3D X-ray.",
      },
      {
        q: "Can both arches be treated at the same time?",
        a: "Sometimes. Your dentist will advise whether to treat both together or one after the other, and your estimate lists each arch separately.",
      },
      {
        q: "Is the fee for one arch or both?",
        a: "The fees shown are per arch, meaning the upper or the lower jaw. Your estimate lists each stage and what it includes.",
      },
      {
        q: "How do I clean a fixed bridge?",
        a: "With a toothbrush and with small brushes or a water flosser under the bridge. The hygienist will show you how, and regular hygiene visits keep the gums around the implants healthy.",
      },
      {
        q: "Can I have this treatment if I have health conditions?",
        a: "Many people can, but some conditions and medicines affect healing. Tell your dentist about your medical history at the consultation so it is taken into account in your plan.",
      },
    ],
    seo: {
      title: "Full-arch implants",
      description: "Fixed teeth on four or six implants, implant-held dentures and the alternatives: the stages from consultation to final bridge, and fees per arch.",
    },
  },

  {
    id: "veneers",
    enabled: true,
    name: "Veneers & cosmetic dentistry",
    shortName: "Veneers & cosmetic",
    need: {
      title: "I’d like to improve how my smile looks",
      description: "Whitening, bonding and porcelain veneers for colour, shape and small gaps.",
      icon: "sparkle",
    },
    intro:
      "Cosmetic treatment ranges from whitening to porcelain veneers. The right choice depends on what you would like to change and on the condition of your teeth, so we start with what bothers you and work from there.",
    image: img("treat-veneers", [700, 1400], 4 / 3, "Four thin porcelain veneers for the upper front teeth"),
    concerns: [
      "Teeth that have darkened or stained",
      "Chipped, worn or uneven edges",
      "Small gaps, or teeth that look too small",
      "Old fillings or crowns that no longer match",
      "Feeling self-conscious about your smile in photographs",
    ],
    explanation: {
      title: "Starting with the least invasive option",
      paragraphs: [
        "Many concerns can be improved without altering healthy tooth structure. Whitening changes colour, bonding adds shape, and veneers do both where more change is wanted.",
        "A veneer is a thin shell of porcelain bonded to the front of a tooth. Before anything is changed, a preview shows the planned shape so you can decide with the result in view.",
      ],
    },
    options: [
      {
        title: "Options to discuss",
        items: [
          {
            title: "Professional whitening",
            description: "Lightens natural teeth using custom trays and whitening gel.",
            consider: "Does not change the colour of fillings, crowns or veneers.",
          },
          {
            title: "Composite bonding",
            description: "Tooth-coloured resin shaped onto the tooth to repair chips, close small gaps or even out edges.",
            consider: "Usually needs little or no drilling. It can stain or chip over time and can be repaired.",
          },
          {
            title: "Porcelain veneers",
            description: "Thin ceramic shells that change the shape and colour of the front teeth.",
            consider: "More stain-resistant than bonding. A thin layer of enamel is usually removed, which cannot be reversed.",
          },
          {
            title: "Straightening first",
            description: "Aligning the teeth can reduce how much other treatment is needed.",
            consider: "Takes longer, and keeps more of your natural teeth.",
          },
        ],
      },
    ],
    suitability: {
      title: "How we decide what suits your teeth",
      intro: "Your dentist examines your teeth and discusses what you would like to change. We consider:",
      factors: [
        "The health of your teeth and gums, which is treated first",
        "How much enamel there is and whether there are existing fillings",
        "Your bite, and any clenching or grinding",
        "The shade and shape you have in mind",
        "How each option is maintained in the long term",
      ],
    },
    caseIds: ["veneers"],
    process: {
      title: "How cosmetic treatment proceeds",
      steps: [
        { title: "Consultation and photographs", description: "We discuss what you would like to change, examine your teeth and take photographs and a digital scan." },
        { title: "Preview", description: "A digital design, and where useful a temporary mock-up on your own teeth, shows the planned result before you decide." },
        { title: "Preparation", description: "For veneers, the teeth are prepared and temporary veneers are fitted while the final ones are made." },
        { title: "Fitting", description: "The veneers are tried in so you can check the shade and shape, then bonded in place." },
        { title: "Review", description: "A follow-up visit to check your bite and comfort, with advice on looking after the result." },
      ],
    },
    feeIds: ["whitening", "veneer"],
    feeNote: "The number of teeth treated is agreed with you at the preview stage and listed in your estimate.",
    clinicianIds: ["daniel-sample"],
    faq: [
      {
        q: "Do veneers damage my teeth?",
        a: "Fitting a veneer usually involves removing a thin layer of enamel, and that cannot be reversed. Your dentist will tell you how much preparation your teeth would need, and whether a less invasive option would achieve what you want.",
      },
      {
        q: "How long do veneers last?",
        a: "Porcelain veneers can last for many years with good care, but they are not permanent and may need replacing. Night-time grinding and biting hard objects shorten their life.",
      },
      {
        q: "Should I whiten my teeth first?",
        a: "Often, yes. Veneers and bonding are matched to the surrounding teeth, so any whitening is usually completed beforehand.",
      },
      {
        q: "Can I see the result before I commit?",
        a: "Yes. A digital preview, and where useful a mock-up tried on your own teeth, lets you see the planned change before any tooth is prepared.",
      },
    ],
    seo: {
      title: "Veneers and cosmetic dentistry",
      description: "Whitening, composite bonding and porcelain veneers compared: what each changes, how suitability is assessed, the stages and guide fees.",
    },
  },

  {
    id: "clear-aligners",
    enabled: true,
    name: "Clear aligners",
    shortName: "Clear aligners",
    need: {
      title: "I want straighter teeth",
      description: "Removable clear aligners for crowding, spacing and bite concerns.",
      icon: "align",
    },
    intro:
      "Clear aligners are thin, removable trays that move teeth a little at a time. They suit many adults and teenagers with crowding or spacing, and an assessment shows whether they are right for you.",
    image: img("treat-aligners", [700, 1400], 4 / 3, "A clear aligner tray above a model of the upper teeth"),
    concerns: [
      "Crowded or overlapping front teeth",
      "Gaps between teeth",
      "Teeth that have moved since earlier orthodontic treatment",
      "A bite that feels uneven",
      "Wanting something less noticeable than fixed braces",
    ],
    explanation: {
      title: "How aligners move teeth",
      paragraphs: [
        "Each aligner is shaped slightly ahead of where your teeth are now. Worn for most of the day, it applies gentle pressure, and you change to the next aligner every one to two weeks.",
        "Aligners are taken out for eating, drinking anything other than water, and cleaning. The result depends on wearing them as advised, and retainers keep the teeth in place afterwards.",
      ],
    },
    options: [
      {
        title: "Options to discuss",
        items: [
          {
            title: "Clear aligners",
            description: "A series of removable trays planned from a digital scan.",
            consider: "Worn for about 20 to 22 hours a day; small tooth-coloured attachments are often needed.",
          },
          {
            title: "Limited treatment for the front teeth",
            description: "A shorter course that addresses mild crowding or spacing of the front teeth.",
            consider: "Does not correct the bite of the back teeth.",
          },
          {
            title: "Fixed braces",
            description: "Brackets and wires, which can suit more complex movements.",
            consider: "Where braces are the better choice, we refer you to an orthodontist.",
          },
          {
            title: "Cosmetic alternatives",
            description: "Bonding or veneers can disguise mild irregularities without moving the teeth.",
            consider: "Changes the appearance, not the position, of the teeth.",
          },
        ],
      },
    ],
    suitability: {
      title: "How we assess whether aligners suit you",
      intro: "Your dentist bases the recommendation on records of your teeth and bite:",
      factors: [
        "A digital scan and photographs of your teeth and bite",
        "X-rays to check the roots and supporting bone",
        "The health of your gums",
        "How far, and in which directions, the teeth need to move",
        "Whether wearing aligners most of the day fits your routine",
      ],
    },
    caseIds: ["aligners"],
    process: {
      title: "The stages of aligner treatment",
      steps: [
        { title: "Assessment and scan", description: "Examination, photographs, X-rays and a digital scan of your teeth." },
        { title: "Your treatment plan", description: "A digital plan shows the intended movement and the expected number of aligners, for you to approve." },
        { title: "Fitting", description: "Your first aligners are fitted, with any attachments, and you are shown how to wear and clean them." },
        { title: "Review visits", description: "Short appointments every six to eight weeks to check progress and collect your next aligners." },
        { title: "Refinement", description: "If some teeth need further movement, additional aligners are made." },
        { title: "Retainers", description: "Retainers hold the teeth in their new position. They are worn long term, usually at night." },
      ],
    },
    feeIds: ["aligners"],
    feeNote: "Your estimate states how many aligners, refinements and retainers are included.",
    clinicianIds: ["daniel-sample"],
    faq: [
      {
        q: "How long does aligner treatment take?",
        a: "It depends on how far the teeth need to move. Mild cases can take a few months and more complex ones over a year. Your plan gives the expected duration for you.",
      },
      {
        q: "Will people notice them?",
        a: "Aligners are clear and fit closely, so they are much less visible than fixed braces. The small attachments on some teeth are tooth-coloured.",
      },
      {
        q: "Do aligners hurt?",
        a: "Most people feel pressure for a day or two after changing to a new aligner. This usually settles quickly.",
      },
      {
        q: "Will I need retainers?",
        a: "Yes. Teeth tend to move back without them, so retainers are part of every plan and are worn long term.",
      },
    ],
    seo: {
      title: "Clear aligners",
      description: "How clear aligners straighten teeth, the alternatives, how suitability is assessed, the stages from scan to retainers, and guide fees.",
    },
  },

  {
    id: "emergency-care",
    enabled: true,
    name: "Emergency dental care",
    shortName: "Urgent problem",
    need: {
      title: "I’m in pain or have an urgent problem",
      description: "Toothache, swelling, a broken tooth or a lost filling. Call us and we will advise you.",
      icon: "urgent",
    },
    intro:
      "If you are in pain or something has broken, call us. Calling is the quickest way to be seen, and we will tell you what to do until your appointment.",
    image: img("treat-emergency", [700, 1400], 4 / 3, "A molar with a chipped corner beside the broken fragment"),
    urgentNotice:
      "Call 911 or go to the nearest emergency room if you have swelling that affects your breathing or swallowing, bleeding that will not stop, or an injury to your face or jaw.",
    concerns: [
      "Toothache that keeps you awake",
      "Swelling of the gum or face",
      "A broken, chipped or knocked-out tooth",
      "A lost filling or crown",
      "Bleeding after an extraction",
      "Pain around a wisdom tooth",
    ],
    explanation: {
      title: "What an emergency appointment is for",
      paragraphs: [
        "An emergency appointment has two aims: to find the cause and to make you comfortable. Your dentist examines the area, takes an X-ray if needed and explains what they find.",
        "If further treatment is needed, it is planned once you are out of pain, and you are told the fee before anything is done.",
      ],
    },
    options: [
      {
        title: "What treatment may involve",
        description: "The right treatment depends on the cause, which your dentist will explain.",
        items: [
          { title: "Relief at the same visit", description: "For example a temporary filling, re-fixing a crown or smoothing a sharp edge." },
          { title: "Root canal treatment", description: "Removes infection from inside a tooth so the tooth can be kept.", consider: "Often completed over more than one visit." },
          { title: "Extraction", description: "For a tooth that cannot be restored.", consider: "Ways to replace the tooth are discussed with you." },
          { title: "Medication", description: "Pain relief advice, and antibiotics only when there are signs that they are needed." },
        ],
      },
    ],
    suitability: {
      title: "What your dentist checks",
      intro: "To find the cause, your dentist looks at:",
      factors: [
        "Where the pain is and what brings it on",
        "The tooth and the surrounding gum, with an X-ray of the area",
        "Any signs of infection or swelling",
        "Whether the tooth can be restored",
      ],
    },
    caseIds: [],
    process: {
      title: "What happens when you call",
      steps: [
        { title: "Call the clinic", description: "Tell us what has happened. We offer the earliest suitable appointment and advise you in the meantime." },
        { title: "Assessment", description: "Your dentist examines the area and takes an X-ray if it is needed." },
        { title: "Getting you comfortable", description: "Treatment to settle the problem, with the fee explained before it starts." },
        { title: "Follow-up", description: "If more treatment is needed, you receive a plan and an estimate." },
      ],
    },
    feeIds: ["emergency"],
    feeNote: "The emergency appointment fee covers the assessment. Treatment carried out at the visit is quoted before it begins.",
    clinicianIds: ["maya-example", "daniel-sample"],
    faq: [
      {
        q: "Can I be seen today?",
        a: "Call as early in the day as you can. We will offer the earliest suitable appointment and advise you on managing the problem until then.",
      },
      {
        q: "What should I do if a tooth is knocked out?",
        a: "Hold the tooth by the crown, not the root. If you can, put it back in its socket; otherwise keep it in milk. Call a dentist straight away, because time matters.",
      },
      {
        q: "I’m not a patient of the clinic. Can I still come?",
        a: "Yes. You do not need to be registered with us to book an emergency appointment.",
      },
      {
        q: "How much does an emergency visit cost?",
        a: "The emergency appointment has a set fee, shown on this page, which covers the assessment and an X-ray of the area. Any treatment is quoted before it starts.",
      },
    ],
    seo: {
      title: "Emergency dental care",
      description: "Toothache, swelling, a broken tooth or a lost filling: what to do, what an emergency appointment involves and what it costs.",
    },
  },

  {
    id: "general-dentistry",
    enabled: true,
    name: "General & preventive dentistry",
    shortName: "Check-up & routine care",
    need: {
      title: "I need a check-up or routine care",
      description: "Examinations, hygiene visits, fillings and preventive care for adults and children.",
      icon: "care",
    },
    intro:
      "Regular examinations and hygiene visits keep small problems small. We see adults and children for routine care, and agree with you how often you need to come.",
    image: img("treat-general", [700, 1400], 4 / 3, "A dental mirror held over a model of the lower teeth"),
    concerns: [
      "It has been a while since my last check-up",
      "Gums that bleed when I brush",
      "Sensitivity to hot, cold or sweet things",
      "A filling that feels rough or has come out",
      "Looking for a dentist for the whole family",
    ],
    explanation: {
      title: "What routine care covers",
      paragraphs: [
        "An examination checks your teeth, gums, bite and the soft tissues of your mouth, with X-rays only when they are needed. A hygiene visit removes the deposits that brushing cannot, and includes advice for cleaning at home.",
        "If we find something that needs treatment, we explain what it is, show you where possible, and give you the fee before booking it.",
      ],
    },
    options: [
      {
        title: "Care we provide",
        items: [
          { title: "Examinations", description: "A full check of your teeth, gums and mouth, with X-rays when needed." },
          { title: "Hygiene visits", description: "Scale and polish, gum care and practical cleaning advice." },
          { title: "Fillings", description: "Tooth-coloured fillings to repair decay or small breaks." },
          { title: "Crowns and onlays", description: "Coverings that protect teeth weakened by large fillings or cracks." },
          { title: "Children’s check-ups", description: "Gentle first visits and preventive care as children grow." },
          { title: "Night guards", description: "Custom guards that protect teeth from grinding and clenching." },
        ],
      },
    ],
    suitability: {
      title: "How often you need to come",
      intro: "There is no single interval that suits everyone. Your dentist recommends one based on:",
      factors: [
        "The condition of your teeth and any existing dental work",
        "The health of your gums",
        "Your diet, habits and general health",
        "How your mouth has changed since your last visit",
      ],
    },
    caseIds: [],
    process: {
      title: "Your first routine visit",
      steps: [
        { title: "New-patient examination", description: "We ask about your dental and medical history, examine your mouth and take any X-rays that are needed." },
        { title: "Hygiene visit", description: "A scale and polish, usually at the same appointment, with advice tailored to you." },
        { title: "Your plan", description: "Any treatment is explained and priced. You decide what to book and when." },
        { title: "Recall", description: "We agree how often you should come and send a reminder when your next visit is due." },
      ],
    },
    feeIds: ["new-patient", "filling"],
    clinicianIds: ["daniel-sample", "priya-example"],
    faq: [
      {
        q: "How often should I have a check-up?",
        a: "It depends on your teeth and gums. Many people are seen every six to twelve months; your dentist will recommend an interval for you.",
      },
      {
        q: "Do you see children?",
        a: "Yes. We see children from their first teeth onwards, and early visits are kept short and relaxed.",
      },
      {
        q: "I’m nervous about visiting the dentist. What can you do?",
        a: "Tell us when you book. We can allow extra time, explain each step before we do it and agree a signal to pause whenever you need to.",
      },
      {
        q: "Do you accept my insurance?",
        a: "We give you an itemised estimate that you can check with your insurer, and we help you submit your claim.",
      },
    ],
    seo: {
      title: "General and preventive dentistry",
      description: "Check-ups, hygiene visits, fillings and preventive care for adults and children, with guide fees for routine visits.",
    },
  },
];

/** Treatments the clinic offers: only these get a page, a need card and a form option. */
export const enabledTreatments = treatments.filter((t) => t.enabled);

export function findTreatment(id: string): Treatment | undefined {
  return enabledTreatments.find((t) => t.id === id);
}
