// components/bible/footer.tsx
"use client";

import { useBibleStore } from "@/lib/store";
import { BOOKS } from "@/lib/bible-types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function BibleFooter({ totalChapters }: { totalChapters: number }) {
   const { chapter, bookId, goNext, goPrev } = useBibleStore();

   const isFirstChapter = chapter === 0 && bookId === BOOKS[0].id;
   const isLastChapter = chapter === totalChapters - 1 && bookId === BOOKS[BOOKS.length - 1].id;

   return (
      <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur">
         <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <Button variant="ghost" onClick={goPrev} disabled={isFirstChapter} className="gap-1.5">
               <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>

            <span className="text-sm text-muted-foreground tabular-nums">
               {chapter + 1} / {totalChapters || "—"}
            </span>

            <Button variant="ghost" onClick={() => goNext(totalChapters)} disabled={isLastChapter} className="gap-1.5">
               Próximo <ChevronRight className="h-4 w-4" />
            </Button>
         </div>
      </footer>
   );
}