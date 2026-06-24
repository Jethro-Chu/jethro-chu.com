"use client";

import { useEffect } from "react";

/**
 * A quiet note for anyone who opens the console. The summit easter egg, the
 * understated half. Logged once.
 */
export function ConsoleEgg() {
  useEffect(() => {
    console.log(
      "%c8,839 ft. you found the summit.%c\nyes, the bird costume is real. so was the climb.\nbuilt by Jethro Chu.\n\nstill restless? ↑ ↑ ↓ ↓, or just climb()",
      "font-weight:600;font-size:13px;color:#3e5c46",
      "color:#6b4310"
    );
  }, []);
  return null;
}
