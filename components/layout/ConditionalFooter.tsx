"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Hides the footer on the full-screen game route. */
export function ConditionalFooter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/work/emotion-stock-market") return null;
  return <>{children}</>;
}
