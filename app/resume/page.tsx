import type { Metadata } from "next";
import Link from "next/link";
import { resume } from "@/content/resume";
import { profileMetadata } from "@/lib/profileSeo";

export const metadata: Metadata = profileMetadata(
  "Jethro Chu | Resume",
  "View and download Jethro Chu's resume.",
  "/resume",
);

export default function ResumePage() {
  return (
    <main id="main" className="flex h-dvh flex-col bg-white font-sans text-sm text-black">
      <nav aria-label="Resume" className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-300 px-4 py-3">
        <Link href="/" className="underline underline-offset-2">
          ← Back to portfolio
        </Link>
        <a href={resume.pdf} download="Jethro_Chu_Resume.pdf" className="underline underline-offset-2">
          Download PDF
        </a>
      </nav>
      <iframe
        src={resume.pdf}
        title="Jethro Chu Resume PDF"
        className="min-h-0 w-full flex-1 border-0"
      />
    </main>
  );
}
