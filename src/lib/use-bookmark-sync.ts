"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBibleStore } from "@/lib/store";
import { applyPendingOver, pullAll, pushPending } from "@/lib/bookmarks-sync";

/**
 * Sincroniza os favoritos com o Supabase em segundo plano. O localStorage
 * continua sendo o que a tela lê — nada no caminho de render vira assíncrono, e
 * a leitura offline (tablet na igreja sem wifi) não depende disso aqui.
 */
export function useBookmarkSync() {
  useEffect(() => {
    const supabase = createClient();
    let disposed = false;
    let running = false;

    async function sync() {
      // onAuthStateChange dispara junto do mount, então sem essa trava a
      // primeira sincronização rodaria duas vezes em paralelo.
      if (running || disposed) return;
      running = true;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || disposed) return;

        const { pending, bookmarks } = useBibleStore.getState();
        if (pending.length) {
          const resolved = await pushPending(user.id, pending, bookmarks);
          if (disposed) return;
          useBibleStore.getState().resolvePending(resolved);
        }

        const remote = await pullAll(user.id);
        if (disposed) return;

        const state = useBibleStore.getState();
        state.applyRemote(applyPendingOver(remote, state.pending, state.bookmarks));
      } catch {
        // Sem rede ou Supabase fora: o local continua valendo e a fila espera a
        // próxima tentativa. Não é erro que o usuário precise ver na tela.
      } finally {
        running = false;
      }
    }

    sync();

    const { data } = supabase.auth.onAuthStateChange(() => void sync());
    window.addEventListener("online", sync);

    return () => {
      disposed = true;
      data.subscription.unsubscribe();
      window.removeEventListener("online", sync);
    };
  }, []);
}
