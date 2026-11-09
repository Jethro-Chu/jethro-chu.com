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
      org: "Azusa Pacific University",
      location: "Azusa, CA",
      role: "Nursing Research Intern · Student Nurse",
      hours: "",
      dates: "May 2026 - Present",
      bullets: [
        "Investigating whether therapeutic communication and touch reduce caregiver compassion fatigue and strengthen caregiver & resident relationships, assisting with data collection, participant tracking, and research documentation.",
      ],
    },
    {
      org: "Huntington Hospital",
      location: "Pasadena, CA",
      role: "Student Nurse",
      hours: "132 Clinical Hours",
      dates: "August - December 2026",
      bullets: [
        "Swan-Ganz catheter monitoring, cardiac output/index, hemodynamic trends, shock states, and vasoactive medications.",
        "Performed focused cardiac, neurologic, respiratory, and perfusion assessments on ICU and ED patients.",
      ],
    },
    {
      org: "Children's Hospital Los Angeles",
      location: "Los Angeles, CA",
      role: "Student Nurse",
      hours: "90 Clinical Hours",
      dates: "March - April 2026",
      bullets: [
        "Rotated through PICU, BMT, CV acute, and med-surg units; performed pediatric assessments.",
      ],
    },
    {
      org: "Kaiser Permanente Mental Health Center",
      location: "Los Angeles, CA",
      role: "Student Nurse",
      hours: "90 Clinical Hours",
      dates: "August - November 2025",
      bullets: [
        "Utilized therapeutic communication techniques (active listening, open-ended questions) to establish rapport and provide psychosocial support for patients with acute psychiatric disorders.",
        "Conducted comprehensive Mental Status Exams (MSE) and safety assessments, consistently monitoring affect, mood, and potential risks for self-harm.",
      ],
    },
    {
      org: "Second Affiliated Hospital of Zhejiang University",
      location: "Hangzhou, China",
      role: "Student Nurse",
      hours: "132 Clinical Hours",
      dates: "January - April 2025",
      bullets: [
        "Rotated through 3 Cardiology units (CVICU, telemetry, OR), gaining exposure to hemodynamic monitoring ECG/telemetry interpretation, cardiovascular assessment, and chest tube monitoring.",
        "Observed open-heart surgical repair of an aortic dissection involving aortic graft reconstruction and valve replacement.",
        "Followed the cardiac care continuum across 3 phases: admission and medical management, operative treatment, and postoperative recovery.",
        "Provided direct care in the Emergency Department to high-acuity patients with strokes, burns, traumatic brain injuries, and acute cardiac conditions.",
      ],
    },
    {
      org: "City of Hope",
      location: "Duarte, CA",
      role: "Student Nurse",
      hours: "110 Clinical Hours",
      dates: "August - December 2024",
      bullets: [
        "Cared for patients receiving cancer treatment while monitoring for infection, bleeding, nausea, fatigue, pain, and nutritional concerns.",
        "Safely assisted with ambulation, transfers, repositioning, and fall prevention for oncology patients.",
        "Followed chemo and neutropenic precautions, reinforcing strict infection control and patient safety.",
      ],
    },
    {
      org: "Huntington Hospital",
      location: "Pasadena, CA",
      role: "Student Nurse",
      hours: "110 Clinical Hours",
      dates: "January - April 2024",
      bullets: [
        "Developed foundational Med-Surg skills in patient assessment, ADLs, mobility, blood sugar checks, infection prevention, medication safety, and patient education under RN supervision.",
      ],
    },
  ] as ClinicalEntry[],

  skills: {
    certifications: [
      "BLS (Expires June 2027)",
      "ACLS (Expires March 2028)",
      "Epic EHR",
      "Cerner PowerChart",
    ],
    clinical: [
      "Head to toe assessment",
      "SBAR handoff",
      "Blood sugar checks",
      "Foley catheter insertion",
      "Wound dressing change",
      "Swan-Ganz catheter & arterial line monitoring",
      "IV insertion",
      "Arterial blood gas (ABG) collection",
      "EKG interpretation",
      "Tracheostomy care",
      "Oxygen therapy",
      "HFNC care",
      "Safe patient handling",
      "Transfers",
      "Gait belt",
      "Stand-assist",
      "Slide board",
    ],
    leadership: [
      "Sigma Theta Tau",
      "Personal Portfolio (jethrochu.com)",
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
    interests: ["Long-distance running", "Hiking", "Church audio/visual ministry"],
  },

  builderContext: {
    title: "Why this background matters",
    body: "My clinical experience shapes the way I build. I care about software that works under pressure, respects messy workflows, and gives people more time for the patient, experiment, or decision in front of them. That is why my projects focus on healthcare, research, AI, and tools that remove friction instead of adding another system to fight.",
  },
} as const;
