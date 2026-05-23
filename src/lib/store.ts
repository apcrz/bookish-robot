// lib/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Translation, BOOKS } from "@/lib/bible-types";

interface BibleStore {
  translation: Translation;
  bookId: string;
  chapter: number;
  fontSize: number;
  bookmarks: string[];
  highlightedVerse: number | null;
  setTranslation: (t: Translation) => void;
  setBookId: (id: string) => void;
  setChapter: (c: number) => void;
  setFontSize: (fn: (s: number) => number) => void;
  toggleBookmark: (key: string) => void;
  setHighlightedVerse: (v: number | null) => void;
  goNext: (totalChapters: number) => void;
  goPrev: () => void;
}

export const useBibleStore = create<BibleStore>()(
  persist(
    (set, get) => ({
      translation: "nvi",
      bookId: "gn",
      chapter: 0,
      fontSize: 17,
      bookmarks: [],
      highlightedVerse: null,

      setTranslation: (translation) => set({ translation }),
      setBookId: (bookId) => set({ bookId, chapter: 0, highlightedVerse: null }),
      setChapter: (chapter) => set({ chapter, highlightedVerse: null }),
      setFontSize: (fn) => set((state) => ({ fontSize: fn(state.fontSize) })),

      toggleBookmark: (key) =>
        set((state) => {
          const bookmarks = state.bookmarks.includes(key)
            ? state.bookmarks.filter((b) => b !== key)
            : [...state.bookmarks, key];
          return { bookmarks };
        }),

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
    { name: "bible-storage" }
  )
);