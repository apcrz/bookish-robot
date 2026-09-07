"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBibleStore } from "@/lib/store";
import { applyPendingOver, pullAll, pushPending } from "@/lib/bookmarks-sync";

// Junta marcações em sequência numa viagem só — favoritar 4 versículos seguidos
// não precisa de 4 idas ao servidor.
const FLUSH_DELAY_MS = 1000;

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
    let rerun = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function sync() {
      if (disposed) return;
      // Chamada durante uma rodada não pode ser descartada: era assim que uma
      // marcação feita no meio da sincronização ficava presa na fila.
      if (running) {
        rerun = true;
        return;
      }

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
        if (rerun && !disposed) {
          rerun = false;
          void sync();
        }
      }
    }

    function schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void sync();
      }, FLUSH_DELAY_MS);
    }

    sync();

    // Sem isto a fila só subia no próximo carregamento da página. Era o bug:
    // favorito marcado no celular ficava no celular até alguém dar refresh.
    // applyRemote não mexe em `pending`, então isso não realimenta sozinho.
    const unsubscribe = useBibleStore.subscribe((state, prev) => {
      if (state.pending !== prev.pending && state.pending.length > 0) schedule();
    });

    const { data } = supabase.auth.onAuthStateChange(() => void sync());
    window.addEventListener("online", sync);

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      unsubscribe();
      data.subscription.unsubscribe();
      window.removeEventListener("online", sync);
    };
  }, []);
}
