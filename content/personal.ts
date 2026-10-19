/** Owner-supplied biography, shared by both readable views and the village. */
export const personalBackground = {
  heading: "Outside of Nursing",
  items: [
    {
      title: "Running",
      body: "I spend a lot of my free time running. I love to run races, seeing myself improve, and getting outside after a long day of studying.",
      photo: {
        src: "/images/marathon-training.jpg",
        width: 768,
        height: 1024,
        alt: "Jethro Chu and a fellow runner holding their finisher medals after a race.",
      },
    },
    {
      title: "Backpacking",
      body: "The Yosemite artwork was inspired by my love for nature. I love backpacking and the mountains are one of my favorite places to be.",
      photo: {
        src: "/images/backpacking.jpg",
        width: 1536,
        height: 2048,
        alt: "Jethro Chu wearing a backpack on a mountain trail, with forest and a snow-covered peak behind him.",
      },
    },
    {
      title: "Caring for Family",
      body: "I help care for my grandmother. Being on the family side of healthcare has given me a better understanding of what patients and their families deal with at home.",
    },
    {
      title: "Building Things & Live Production",
      body: "I like making things and figuring out how they work. I helped build Lab Logger at HackTech, where our team placed 4th.",
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
