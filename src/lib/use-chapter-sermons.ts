"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Translation } from "@/lib/bible-types";

export interface ChapterSermon {
   id: string;
   verse_start: number | null;
   verse_end: number | null;
}

export function useChapterSermons(translation: Translation, bookId: string, chapter: number) {
   const [sermons, setSermons] = useState<ChapterSermon[]>([]);

   useEffect(() => {
      if (!bookId) return;

      let isMounted = true;

      async function load() {
         const supabase = createClient();
         const { data } = await supabase
            .from("sermons")
            .select("id, verse_start, verse_end")
            .eq("translation", translation)
            .eq("book_id", bookId)
            .eq("chapter", chapter);

         if (isMounted) setSermons(data ?? []);
      }

      load();

      return () => {
         isMounted = false;
      };
   }, [translation, bookId, chapter]);

   return sermons;
}
