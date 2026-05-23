import { useState, useEffect } from "react";
import { BibleBook, Translation } from "./bible-types";
import { getCachedBook, setCachedBook } from "./db";

export function useBible(translation: Translation, bookId: string) {
  const [data, setData] = useState<BibleBook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) return;

    let isMounted = true;

    async function loadBook() {
      setLoading(true);
      setError(null);

      try {
        const cached = await getCachedBook(translation, bookId);
        if (cached && isMounted) {
          setData(cached);
          setLoading(false);
          return;
        }

        const res = await fetch(`/${translation}/${bookId}.json`);
        if (!res.ok) throw new Error("Livro não encontrado");

        const json: BibleBook = await res.json();

        await setCachedBook(translation, bookId, json);

        if (isMounted) setData(json);
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBook();

    return () => { isMounted = false; };
  }, [translation, bookId]);

  return { data, loading, error };
}