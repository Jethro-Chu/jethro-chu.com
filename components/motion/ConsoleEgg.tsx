"use client";

import { useEffect } from "react";

/**
 * A quiet note for anyone who opens the console. The summit easter egg, the
 * understated half. Logged once.
 */
export function ConsoleEgg() {
  useEffect(() => {
    console.log(
      "%c8,839 ft. you found the summit.%c\nthe bird costume is real, and so is the climb.\nbuilt by Jethro Chu.",
      "font-weight:600;font-size:13px;color:#3e5c46",
      "color:#6b4310"
    );
  }, []);
  return null;
}
