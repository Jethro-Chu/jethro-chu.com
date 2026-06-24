"use client";

/* ============================================================
   MEDICAL AKINATOR  ·  provider
   Owns the open/close state for the hidden game and mounts the
   modal. Exposed via useMedicalAkinator() so the hero command bar
   can open it when the player submits the exact command "akinator".
   Kept separate from the Ask Jethro assistant so the easter egg is
   fully self-contained and removable.
   ============================================================ */

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { MedicalAkinatorModal } from "./MedicalAkinatorGame";

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
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const ctx = useMemo<MedicalAkinatorCtx>(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    <Ctx.Provider value={ctx}>
      {children}
      <MedicalAkinatorModal open={isOpen} onClose={close} />
    </Ctx.Provider>
  );
}
