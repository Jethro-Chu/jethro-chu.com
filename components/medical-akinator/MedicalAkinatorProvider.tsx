"use client";

/* ============================================================
   MEDICAL AKINATOR  ·  provider
   Owns the open/close state for the hidden symptom checker and mounts
   the modal. Exposed via useMedicalAkinator() so the hero command bar
   can open it when the user submits the exact command "akinator".
   Kept separate from the Ask Jethro assistant so the feature is fully
   self-contained and removable, and gated by a feature flag.
   ============================================================ */

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { MedicalAkinatorModal } from "./MedicalAkinator";
import { MEDICAL_AKINATOR_ENABLED } from "@/lib/featureFlags";

interface MedicalAkinatorCtx {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const Ctx = createContext<MedicalAkinatorCtx | null>(null);

export function useMedicalAkinator(): MedicalAkinatorCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMedicalAkinator must be used within <MedicalAkinatorProvider>");
  return v;
}

export function MedicalAkinatorProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  // feature flag: when disabled, open() is a no-op and the modal never mounts
  const open = useCallback(() => setIsOpen(MEDICAL_AKINATOR_ENABLED), []);
  const close = useCallback(() => setIsOpen(false), []);

  const ctx = useMemo<MedicalAkinatorCtx>(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    <Ctx.Provider value={ctx}>
      {children}
      {isOpen && <MedicalAkinatorModal onClose={close} />}
    </Ctx.Provider>
  );
}
