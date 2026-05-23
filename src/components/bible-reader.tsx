// components/bible-reader.tsx
"use client";

import { useEffect, useState } from "react";
import { useBibleStore } from "@/lib/store";
import { useBible } from "@/lib/use-bible";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BibleHeader } from "./bible/header";
import { VerseList } from "./bible/verse-list";
import { BibleFooter } from "./bible/footer";

export function BibleReader() {
   const [mounted, setMounted] = useState(false);
   const { translation, bookId } = useBibleStore();
   const { data, loading, error } = useBible(translation, bookId);
   const totalChapters = data?.chaptersCount ?? 0;

   useEffect(() => {
      setMounted(true);
   }, []);

   if (!mounted) {
      return null;
   }

   return (
      <TooltipProvider>
         <div className="min-h-screen flex flex-col bg-background text-foreground">
            <BibleHeader totalChapters={totalChapters} />
            <VerseList data={data} loading={loading} error={error} />
            <BibleFooter totalChapters={totalChapters} />
         </div>
      </TooltipProvider>
   );
}
