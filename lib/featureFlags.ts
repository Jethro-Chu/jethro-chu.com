/* ============================================================
   FEATURE FLAGS
   ============================================================
   Simple, build-time kill switches. NEXT_PUBLIC_* vars are inlined into
   the client bundle AND readable on the server, so a single flag governs
   the trigger, the modal, and the API route together.
   ============================================================ */

/**
 * Medical symptom-checker ("akinator") feature.
 * Disable by setting NEXT_PUBLIC_MEDICAL_AKINATOR_ENABLED="false"
 * (in .env.local and in the Vercel project env). Default: enabled.
 */
export const MEDICAL_AKINATOR_ENABLED =
  process.env.NEXT_PUBLIC_MEDICAL_AKINATOR_ENABLED !== "false";
