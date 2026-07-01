"use client";

/* ============================================================
   useIsTouch  ·  is the primary pointer coarse (a touch screen)?
   Drives the mobile village HUD: the joystick, the locked zoomed-out
   view, and the bottom-left minimap. Uses (pointer: coarse) rather than a
   width breakpoint so a landscape phone (wide but touch) is still treated
   as mobile, and a touchscreen laptop (fine primary pointer) is not.
   ============================================================ */

import { useEffect, useState } from "react";

export function useIsTouch(): boolean {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(pointer: coarse)");
    if (!mq) return;
    const update = () => setTouch(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return touch;
}
