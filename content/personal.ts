/** Owner-supplied biography, shared by both readable views and the village. */
export const personalBackground = {
  heading: "Beyond the Bedside & Code",
  items: [
    {
      title: "Marathon Endurance & Zone 2 Training",
      body: "Outside of clinical shifts, I am a distance runner training for the November 2026 NYC Marathon using heart-rate-driven (Zone 2) physiological pacing, building the physical stamina, discipline, and burnout resilience required to stay sharp across 12-hour critical-care shifts.",
    },
    {
      title: "High-Sierra Backpacking & Cold-Water Snorkeling",
      body: "The pixel Yosemite Valley on this site comes from a real love for the outdoors, from backpacking trails in the Sierra Nevada and California peaks to cold-water ocean snorkeling through the kelp forests of Catalina and the Channel Islands.",
    },
    {
      title: "Family Caregiving & Home Care Roots",
      body: "While I love hemodynamics and building software, my path into nursing is grounded at home as a hands-on family caregiver for my grandmother. That experience first taught me bedside patience, empathy, and patient advocacy.",
    },
    {
      title: "Hackathons & Live A/V Production",
      body: "I thrive in live, zero-margin-for-error team environments, whether winning 4th place at HackTech building Lab Logger or running behind-the-scenes technical operations on a live audio/visual production team.",
    },
  ],
  photo: {
    src: "/images/hacktech-team.jpg",
    // Display dimensions account for the original JPEG's EXIF rotation.
    width: 4284,
    height: 5712,
    alt: "Jethro Chu (second from left) and his four-person engineering team wearing navy HackTech crewnecks after winning 4th place at Caltech's HackTech hackathon for building Lab Logger",
    caption: "4th Place at HackTech · Building Lab Logger (lab-logger.com)",
  },
  overlook: "BSN expected December 2026 at Azusa Pacific University · NYC Marathon runner, Sierra backpacker, family caregiver, and 4th-place HackTech builder.",
} as const;

export type PersonalBackgroundContent = typeof personalBackground;
