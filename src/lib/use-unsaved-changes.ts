"use client";

import { useEffect } from "react";

export const UNSAVED_CHANGES_MESSAGE = "Você tem alterações não salvas. Sair mesmo assim?";

// Avisa ao fechar/recarregar a aba com alterações pendentes. Navegação interna
// (Link, router.push) não dispara beforeunload, então quem tiver link de saída
// precisa chamar confirmDiscard() no clique.
export function useUnsavedChangesWarning(dirty: boolean) {
   useEffect(() => {
      if (!dirty) return;

      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
         e.preventDefault();
         e.returnValue = "";
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
   }, [dirty]);
}

export function confirmDiscard(dirty: boolean) {
   return !dirty || window.confirm(UNSAVED_CHANGES_MESSAGE);
}
