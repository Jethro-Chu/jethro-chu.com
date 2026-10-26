import type { Metadata } from "next";

export const metadata: Metadata = { title: "Wok & Skis · Jethro Chu" };

export default function SkiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
