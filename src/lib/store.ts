// lib/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Translation, TRANSLATIONS, BOOKS } from "@/lib/bible-types";

// A chave é `livro:capítulo:versículo` — sem tradução. Favorito é o versículo,
// não a combinação versículo+tradução: marcou em NVI, aparece marcado em ACF.
export function bookmarkKey(bookId: string, chapter: number, verse: number) {
  return `${bookId}:${chapter}:${verse}`;
}

export interface Bookmark {
  key: string;
  // Snapshot do texto no momento em que foi salvo, junto da tradução de origem.
  // O drawer não carrega os JSONs dos livros, e do outro aparelho pode nem ter
  // o livro em cache — sem o snapshot a lista ficaria só com coordenadas.
  text: string;
  translation: Translation;
  createdAt: string;
}

// No máximo uma pendência por chave: enfileirar sempre descarta a anterior da
// mesma chave, então marcar-e-desmarcar offline não vira duas viagens.
export interface PendingOp {
  op: "add" | "remove";
  key: string;
}

interface BibleStore {
  translation: Translation;
  bookId: string;
  chapter: number;
  fontSize: number;
  bookmarks: Bookmark[];
  pending: PendingOp[];
  syncedAt: string | null;
  highlightedVerse: number | null;
  setTranslation: (t: Translation) => void;
  setBookId: (id: string) => void;
  setChapter: (c: number) => void;
  setFontSize: (fn: (s: number) => number) => void;
  toggleBookmark: (key: string, text: string, translation: Translation) => void;
  removeBookmark: (key: string) => void;
  applyRemote: (bookmarks: Bookmark[]) => void;
  resolvePending: (keys: string[]) => void;
  setHighlightedVerse: (v: number | null) => void;
  goNext: (totalChapters: number) => void;
  goPrev: () => void;
}

const isTranslation = (v: unknown): v is Translation =>
  TRANSLATIONS.some((t) => t.id === v);

function enqueue(pending: PendingOp[], op: PendingOp): PendingOp[] {
  return [...pending.filter((p) => p.key !== op.key), op];
}

export const useBibleStore = create<BibleStore>()(
  persist(
    (set, get) => ({
      translation: "nvi",
      bookId: "gn",
      chapter: 0,
      fontSize: 17,
      bookmarks: [],
      pending: [],
      syncedAt: null,
      highlightedVerse: null,

      setTranslation: (translation) => set({ translation }),
      setBookId: (bookId) => set({ bookId, chapter: 0, highlightedVerse: null }),
      setChapter: (chapter) => set({ chapter, highlightedVerse: null }),
      setFontSize: (fn) => set((state) => ({ fontSize: fn(state.fontSize) })),

      // Local muda na hora e a viagem até o Supabase fica pendente. É isso que
      // faz favoritar funcionar sem rede — no tablet, no meio da pregação.
      toggleBookmark: (key, text, translation) =>
        set((state) => {
          const exists = state.bookmarks.some((b) => b.key === key);
          return exists
            ? {
                bookmarks: state.bookmarks.filter((b) => b.key !== key),
                pending: enqueue(state.pending, { op: "remove", key }),
              }
            : {
                bookmarks: [
                  ...state.bookmarks,
                  { key, text, translation, createdAt: new Date().toISOString() },
                ],
                pending: enqueue(state.pending, { op: "add", key }),
              };
        }),

      removeBookmark: (key) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.key !== key),
          pending: enqueue(state.pending, { op: "remove", key }),
        })),

      // Servidor é a verdade depois que as pendências subiram.
      applyRemote: (bookmarks) =>
        set({ bookmarks, syncedAt: new Date().toISOString() }),

      resolvePending: (keys) =>
        set((state) => ({
          pending: state.pending.filter((p) => !keys.includes(p.key)),
        })),

      setHighlightedVerse: (highlightedVerse) => set({ highlightedVerse }),

      goNext: (totalChapters) => {
        const { chapter, bookId } = get();
        if (chapter < totalChapters - 1) {
          set({ chapter: chapter + 1, highlightedVerse: null });
        } else {
          const idx = BOOKS.findIndex((b) => b.id === bookId);
          if (idx < BOOKS.length - 1) {
            set({ bookId: BOOKS[idx + 1].id, chapter: 0, highlightedVerse: null });
          }
        }
      },

      goPrev: () => {
        const { chapter, bookId } = get();
        if (chapter > 0) {
          set({ chapter: chapter - 1, highlightedVerse: null });
        } else {
          const idx = BOOKS.findIndex((b) => b.id === bookId);
          if (idx > 0) {
            set({ bookId: BOOKS[idx - 1].id, chapter: 0, highlightedVerse: null });
          }
        }
      },
    }),
    {
      name: "bible-storage",
      version: 2,
      // v0: bookmarks eram string[] com chave "nvi:rm:0:0".
      // v1: { key, text }, mesma chave com tradução.
      // v2: chave sem tradução, e a tradução virou campo.
      //
      // A migração já semeia a fila de pendências com tudo que existe local, e é
      // isso que faz a primeira sincronização subir seus favoritos atuais em vez
      // de o servidor vazio apagá-los.
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        if (version >= 2) return state as unknown as BibleStore;

        const raw = Array.isArray(state.bookmarks) ? state.bookmarks : [];
        const seen = new Set<string>();
        const migrated: Bookmark[] = [];

        for (const item of raw) {
          const legacyKey =
            typeof item === "string" ? item : (item as { key?: unknown }).key;
          if (typeof legacyKey !== "string") continue;

          const [translation, bookId, chapter, verse] = legacyKey.split(":");
          if (verse === undefined) continue;

          const key = bookmarkKey(bookId, Number(chapter), Number(verse));
          // O mesmo versículo salvo em duas traduções colapsa em um só.
          if (seen.has(key)) continue;
          seen.add(key);

          migrated.push({
            key,
            text:
              typeof item === "string"
                ? ""
                : String((item as { text?: unknown }).text ?? ""),
            translation: isTranslation(translation) ? translation : "nvi",
            createdAt: new Date().toISOString(),
          });
        }

        state.bookmarks = migrated;
        state.pending = migrated.map((b) => ({ op: "add", key: b.key }));
        state.syncedAt = null;
        return state as unknown as BibleStore;
      },
    }
  )
);
