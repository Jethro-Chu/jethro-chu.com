import type { Metadata } from "next";
import { site } from "@/content/content";
import { landmarks } from "@/content/portfolio";
import { resume } from "@/content/resume";

/** Metadata copy is separate from the shared visible landmark content. */
export const profileTitle = "Jethro Chu · BSN Nursing Candidate (Dec 2026) & Healthcare Software Builder";
export const profileDescription =
  "Portfolio of Jethro Chu, a December 2026 BSN candidate at Azusa Pacific University with 560+ clinical hours across Huntington Health, City of Hope, CHLA, Emanate Health, Kaiser Permanente, and Zhejiang University (Hangzhou). Focused on critical care, cardiovascular nursing, and clinical software.";

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
    description:
      "New graduate BSN nursing candidate at Azusa Pacific University (Dec 2026) focused on critical care and cardiovascular nursing, and creator of NurseJet, MedMath, and ABG Arena.",
  },
  twitter: {
    ...homeDefaults.twitter,
    title: socialTitle,
    description:
      "BSN candidate at Azusa Pacific University (Dec 2026) with 560+ clinical hours in critical care, cardiovascular, telemetry, and step-down settings.",
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
    roleName: entry?.role ?? "Student Nurse Clinical Rotation",
    description: [
      `${placement.organization}: ${placement.experience}.`,
      ...(entry ? [
        `${entry.role}, ${entry.location}. ${entry.dates}. ${entry.hours}.`,
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
    "Bachelor of Science in Nursing (BSN) candidate at Azusa Pacific University (expected graduation December 2026) and healthcare software developer. Focused on critical care and cardiovascular nursing with 560+ hours of clinical training across California and Hangzhou, China.",
  image: `${site.url}/images/halfdome-summit.jpg`,
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
  ],
  // subjectOf accepts a CreativeWork or Event, not a Role. The actual readable
  // clinical journey and resume are documents about the student placements.
  subjectOf: [
    {
      "@type": "WebPage",
      url: `${site.url}/#chapel`,
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
