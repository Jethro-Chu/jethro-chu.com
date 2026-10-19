import type { Metadata } from "next";
import { site } from "@/content/content";
import { landmarks } from "@/content/portfolio";
import { resume } from "@/content/resume";

/** Metadata copy is separate from the shared visible landmark content. */
export const profileTitle = "Jethro Chu · BSN Nursing Candidate (Dec 2026) & Healthcare Software Builder";
export const profileDescription =
  "Portfolio of Jethro Chu, a December 2026 BSN candidate at Azusa Pacific University (560+ clinical hours across Huntington Health, City of Hope, CHLA, Emanate Health, Kaiser Permanente, and Zhejiang University in Hangzhou), 4th-place HackTech winner (Lab Logger), NYC Marathon runner, and family caregiver focused on critical care and cardiovascular nursing.";
export const profileOpenGraphDescription =
  "New graduate BSN nursing candidate at Azusa Pacific University (Dec 2026) focused on critical care and cardiovascular nursing. Creator of NurseJet, MedMath, and ABG Arena, 4th-place HackTech winner (Lab Logger), NYC Marathon runner, and family caregiver.";
export const profileTwitterDescription =
  "BSN candidate at Azusa Pacific University (Dec 2026) with 560+ clinical hours in critical care, cardiovascular, telemetry, and step-down settings. 4th-place HackTech winner, marathon runner, and Sierra backpacker.";

export function profileMetadata(
  title: string,
  description: string,
  path: "/" | "/resume" | "/website",
): Metadata {
  // Reuse the existing social image. No new artwork or visible page assets.
  const images = [{
    url: "/opengraph-image.png",
    alt: "Jethro Chu portfolio in an explorable pixel-art Yosemite Village",
  }];

  return {
    title,
    description,
    alternates: { canonical: `${site.url}${path}` },
    openGraph: {
      title,
      description,
      url: `${site.url}${path}`,
      siteName: site.name,
      type: "website",
      locale: "en_US",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

const homeDefaults = profileMetadata(profileTitle, profileDescription, "/");
const socialTitle = "Jethro Chu · BSN Nursing Candidate & Healthcare Software Builder";

export const homeMetadata: Metadata = {
  ...homeDefaults,
  openGraph: {
    ...homeDefaults.openGraph,
    type: "profile",
    title: socialTitle,
    description: profileOpenGraphDescription,
  },
  twitter: {
    ...homeDefaults.twitter,
    title: socialTitle,
    description: profileTwitterDescription,
  },
};

const personId = `${site.url}/#jethro-chu`;
const clinicalJourney = landmarks.find((landmark) => landmark.id === "chapel")?.clinicalJourney;

/**
 * Share the six visible clinical sites with structured data. Resume entries add
 * documented titles, locations, dates and hours without inventing an Emanate
 * title or hours. Roles describe student placements, not staff employment.
 */
const clinicalAffiliations = (clinicalJourney?.sites ?? []).map((placement) => {
  const entry = resume.clinical.find((clinical) =>
    placement.organization.includes(clinical.org) || clinical.org.startsWith(placement.organization),
  );

  return {
    "@type": "Role",
    roleName: "Student Nurse Clinical Rotation",
    description: [
      `${placement.organization}: ${placement.experience}.`,
      ...(entry ? [
        `Student Nurse Clinical Rotation, ${entry.location}. ${entry.dates}. ${entry.hours}.`,
        ...entry.bullets.map((bullet) => `${bullet}.`),
      ] : []),
    ].join(" "),
    affiliation: {
      "@type": "MedicalOrganization",
      name: placement.organization,
      ...(entry ? { location: { "@type": "Place", name: entry.location } } : {}),
    },
  };
});

/**
 * One Person in the initial server HTML. Current enrollment uses affiliation,
 * not alumniOf. Only the certifications already listed on the resume are
 * awarded credentials; the BSN and RN license remain pending.
 */
export const profileStructuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": personId,
  name: site.name,
  url: `${site.url}/`,
  jobTitle: "BSN Student & New Graduate Nursing Candidate (Expected December 2026)",
  description:
    "Bachelor of Science in Nursing (BSN) candidate at Azusa Pacific University (expected graduation December 2026), healthcare software developer (4th-place winner at HackTech for Lab Logger), and distance marathon runner training for the November 2026 NYC Marathon using Zone 2 physiological pacing. Grounded in hands-on family caregiving for his grandmother, live A/V production operations, and High-Sierra backpacking, with 560+ hours of clinical training across California and Hangzhou, China focused on critical care and cardiovascular nursing.",
  image: [
    `${site.url}/images/halfdome-summit.jpg`,
    `${site.url}/images/hacktech-team.jpg`,
  ],
  award: ["4th Place Winner, HackTech Hackathon (Lab Logger)"],
  affiliation: [
    {
      "@type": "CollegeOrUniversity",
      name: resume.education.school,
      sameAs: "https://www.apu.edu/",
      description: "Bachelor of Science in Nursing (BSN) Candidate, Expected Graduation December 2026",
    },
    ...clinicalAffiliations,
  ],
  hasCredential: [
    {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "certification",
      name: "Advanced Cardiovascular Life Support (ACLS)",
    },
    {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "certification",
      name: "Basic Life Support (BLS)",
    },
  ],
  knowsAbout: [
    "Critical Care Nursing (Student Clinical Training)",
    "Cardiovascular Nursing",
    "Telemetry Interpretation",
    "Hemodynamics",
    "Early Recognition of Patient Deterioration",
    "Evidence-Based Practice",
    "Step-Down / Definitive Observation Unit (DOU) Care",
    "Cardiac Catheterization Lab (Cath Lab) Clinical Exposure",
    "Cardiac Surgery & Cardiology Clinical Exposure",
    "Emergency & Orthopedic Nursing Exposure",
    "Medical-Surgical Nursing",
    "Pediatric Intensive Care (PICU) Clinical Exposure",
    "Bone Marrow Transplant Oncology Clinical Exposure",
    "Healthcare Software Development",
    "Clinical Decision Support & Nursing Education Tools",
    "Distance Marathon Running & Zone 2 Heart-Rate Physiological Training",
    "Hands-On Family Caregiving & Home Care Support",
    "Live Audio/Visual (A/V) Technical Production",
    "High-Sierra Wilderness Backpacking",
  ],
  // subjectOf accepts a CreativeWork or Event, not a Role. The actual readable
  // clinical journey and resume are documents about the student placements.
  subjectOf: [
    {
      "@type": "WebPage",
      url: `${site.url}/website#chapel`,
      name: "Jethro Chu: Clinical Experience",
      description:
        "Clinical rotations (560+ total hours) across Huntington Health (Huntington Hospital), Emanate Health, City of Hope, Children's Hospital Los Angeles, Kaiser Permanente, and an international clinical rotation at the Second Affiliated Hospital of Zhejiang University in Hangzhou, China.",
      about: { "@id": personId },
    },
    {
      "@type": "ProfilePage",
      url: `${site.url}/resume`,
      name: "Jethro Chu: Nursing Resume",
      mainEntity: { "@id": personId },
      relatedLink: `${site.url}${resume.pdf}`,
    },
  ],
};
