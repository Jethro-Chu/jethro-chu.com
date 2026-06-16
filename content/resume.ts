/* ============================================================
   RESUME  ·  content for /resume (editable source of truth)
   Plain data; the page renders it in the field-guide style.
   ============================================================ */

export interface ClinicalEntry {
  org: string;
  location: string;
  role: string;
  hours: string;
  dates: string;
  bullets: string[];
}

export const resume = {
  subtitle:
    "Clinical experience, nursing education, and the builder background behind my healthcare AI work.",
  // small field-note metadata (phone stays in the PDF only, not on the page)
  meta: [
    "Jethro Chu",
    "Bachelor of Science in Nursing",
    "Azusa Pacific University",
    "Expected graduation December 2026",
    "Bay Area / Los Angeles",
  ],
  pdf: "/Jethro_Chu_Resume.pdf",

  education: {
    degree: "Bachelor of Science in Nursing",
    school: "Azusa Pacific University",
    grad: "Expected Graduation: December 2026",
    gpa: "3.8",
    honors: "Dean's List",
  },

  clinical: [
    {
      org: "Children's Hospital Los Angeles",
      location: "Los Angeles, CA",
      role: "Student Nurse Intern",
      hours: "90 Clinical Hours",
      dates: "March – April 2026",
      bullets: [
        "Rotated through PICU, BMT, CV acute, and med-surg units",
        "Performed pediatric assessments",
        "Calculated weight-based medication dosages for safe administration",
      ],
    },
    {
      org: "Kaiser Permanente Mental Health Center",
      location: "Los Angeles, CA",
      role: "Student Nurse Intern",
      hours: "90 Clinical Hours",
      dates: "August – November 2025",
      bullets: [
        "Used therapeutic communication techniques including active listening and open-ended questions",
        "Built rapport and provided psychosocial support for patients with acute psychiatric disorders",
        "Conducted Mental Status Exams and safety assessments",
        "Monitored affect, mood, and potential self-harm risk",
      ],
    },
    {
      org: "Second Affiliated Hospital of Zhejiang University",
      location: "Hangzhou, China",
      role: "Student Nurse Intern",
      hours: "160 Clinical Hours",
      dates: "January – April 2025",
      bullets: [
        "Rotated through CVICU, Cardiology, and Emergency Departments",
        "Supported telemetry monitoring, acute assessments, and interdisciplinary rounds",
        "Performed comprehensive system assessments including neurological, cardiac, respiratory, GI, and GU",
        "Provided direct care to complex patients including strokes, TBIs, and acute cardiac conditions",
      ],
    },
    {
      org: "City of Hope",
      location: "Duarte, CA",
      role: "Student Nurse Intern",
      hours: "110 Clinical Hours",
      dates: "August – December 2024",
      bullets: [
        "Delivered direct patient care under RN supervision",
        "Assisted with bathing, toileting, feeding, grooming, vitals, and I&O documentation in Epic",
        "Assisted with ambulation, transfers, repositioning, and fall prevention for oncology patients",
        "Followed chemo and neutropenic precautions",
        "Reinforced infection control and patient safety",
      ],
    },
    {
      org: "Huntington Hospital",
      location: "Pasadena, CA",
      role: "Student Nurse Intern",
      hours: "110 Clinical Hours",
      dates: "January – April 2024",
      bullets: [
        "Performed ADLs including bathing, toileting, grooming, and feeding",
        "Assisted with ambulation, transfers, and patient transport",
        "Practiced infection prevention including standard precautions, isolation precautions, PPE, and equipment cleaning",
        "Used teach-back with patients and families",
        "Practiced medication administration and IV insertion with preceptor supervision",
        "Prepared supplies and verified the six rights with preceptor",
      ],
    },
  ] as ClinicalEntry[],

  skills: {
    certifications: ["BLS", "ACLS", "Epic EHR: vitals, ADLs, I&O"],
    clinical: [
      "Vital signs",
      "POC glucose",
      "I&O",
      "Specimen collection",
      "ADLs",
      "Safe patient handling",
      "Gait belt",
      "Stand-assist",
      "Slide board",
      "Infection control",
      "PPE",
      "Isolation precautions",
      "Equipment cleaning",
      "IV insertion exposure",
      "Medication administration exposure",
      "Trach care exposure",
      "Head-to-toe assessment",
    ],
    professional: [
      "Time management",
      "Prioritization",
      "Problem solving",
      "Team collaboration",
      "Patient communication",
      "Teach-back",
      "Clinical judgment under supervision",
    ],
    mentorship: {
      title: "Code Blue Mentor",
      desc: "Provided peer mentorship to three underclassmen nursing students through tutoring and guidance.",
    },
    interests: ["Church Audio / Visual team", "Long distance running", "Hiking"],
  },

  builderContext: {
    title: "Why this background matters",
    body: "My clinical experience shapes the way I build. I care about software that works under pressure, respects messy workflows, and gives people more time for the patient, experiment, or decision in front of them. That is why my projects focus on healthcare, research, AI, and tools that remove friction instead of adding another system to fight.",
  },
} as const;
