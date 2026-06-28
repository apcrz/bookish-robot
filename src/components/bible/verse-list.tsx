// src/components/bible/verse-list.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useBibleStore } from "@/lib/store";
import { BOOKS } from "@/lib/bible-types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bookmark, Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerseListProps {
   data: any;
   loading: boolean;
   error: string | null;
}

export function VerseList({ data, loading, error }: VerseListProps) {
   const scrollRef = useRef<HTMLDivElement>(null);
   const [copiedVerse, setCopiedVerse] = useState<number | null>(null);
   const [errorVerse, setErrorVerse] = useState<number | null>(null);

   const {
      translation,
      bookId,
      chapter,
      fontSize,
      bookmarks,
      highlightedVerse,
      setHighlightedVerse,
      toggleBookmark
   } = useBibleStore();

   const currentBook = BOOKS.find((b) => b.id === bookId);
   const verses = data?.chapters[chapter] ?? [];

   useEffect(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
   }, [chapter, bookId]);

   const handleShare = async (verseText: string, verseIndex: number) => {
      const bookName = currentBook?.name || "Bíblia";
      const reference = `${bookName} ${chapter + 1}:${verseIndex + 1}`;
      const shareText = `"${verseText}"\n— ${reference} (${translation.toUpperCase()})`;

      const shareData = {
         title: reference,
         text: shareText,
      };

      try {
         if (navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
         }

         if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareText);
            setCopiedVerse(verseIndex);
            setTimeout(() => setCopiedVerse(null), 1800);
            return;
         }

         const textArea = document.createElement("textarea");
         textArea.value = shareText;
         textArea.style.position = "fixed";
         textArea.style.left = "-999999px";
         textArea.style.top = "-999999px";
         document.body.appendChild(textArea);
         textArea.focus();
         textArea.select();

         const successful = document.execCommand("copy");
         document.body.removeChild(textArea);

         if (successful) {
            setCopiedVerse(verseIndex);
            setTimeout(() => setCopiedVerse(null), 1800);
         } else {
            throw new Error("ExecCommand failed");
         }

      } catch (error: any) {
         console.warn("Falha ao compartilhar/copiar:", error);

         if (error?.name === "AbortError") return;

         setErrorVerse(verseIndex);
         setTimeout(() => setErrorVerse(null), 2500);
      }
   };
   return (
      <main className="flex-1 overflow-hidden bg-background">
         <ScrollArea ref={scrollRef} className="h-[calc(100vh-108px)]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">

               <div className="mb-8 md:mb-12 text-center">
                  <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                     {currentBook?.name}
                  </h1>
                  <p className="mt-1 text-xl md:text-2xl text-muted-foreground">
                     Capítulo {chapter + 1}
                  </p>
                  <Badge variant="outline" className="mt-4 text-xs tracking-widest">
                     {translation.toUpperCase()}
                  </Badge>
               </div>

               {loading && (
                  <div className="space-y-6 px-2">
                     {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="flex gap-4">
                           <Skeleton className="h-5 w-6 shrink-0" />
                           <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-4/5" />
                           </div>
                        </div>
                     ))}
                  </div>
               )}

               {error && (
                  <div className="text-center py-16 text-muted-foreground">
                     <p className="text-lg">Não foi possível carregar este livro</p>
                  </div>
               )}

               {!loading && !error && (
                  <div className="space-y-5 md:space-y-8">
                     {verses.map((verse: string, idx: number) => {
                        const isHighlighted = highlightedVerse === idx;
                        const bookmarkKey = `${translation}:${bookId}:${chapter}:${idx}`;
                        const isBookmarked = bookmarks.includes(bookmarkKey);

                        return (
                           <div
                              key={idx}
                              onClick={() => setHighlightedVerse(isHighlighted ? null : idx)}
                              className={cn(
                                 "group relative flex gap-4 rounded-xl px-4 py-5 transition-all active:bg-muted/60",
                                 isHighlighted
                                    ? "bg-primary/10 dark:bg-primary/15 border-l-4 border-primary"
                                    : "hover:bg-muted/40 md:hover:bg-muted/50"
                              )}
                           >
                              <div className="shrink-0 w-7 pt-0.5">
                                 <span className="verse-number text-base font-medium tabular-nums">
                                    {idx + 1}
                                 </span>
                              </div>

                              <p
                                 className="bible-text flex-1 text-[15.5px] leading-[1.75] tracking-[-0.005em] text-foreground/95 pr-2"
                                 style={{ fontSize: `${fontSize}px` }}
                              >
                                 {verse}
                              </p>

                              <div className={cn(
                                 "flex flex-col gap-0.5 shrink-0 transition-all",
                                 isHighlighted
                                    ? "opacity-100"
                                    : "opacity-0 md:group-hover:opacity-100"
                              )}>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                       <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 -mr-1"
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             toggleBookmark(bookmarkKey);
                                          }}
                                       >
                                          <Bookmark
                                             className={cn(
                                                "h-4 w-4",
                                                isBookmarked && "fill-primary text-primary"
                                             )}
                                          />
                                       </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">Favoritar</TooltipContent>
                                 </Tooltip>

                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                       <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 -mr-1"
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             handleShare(verse, idx);
                                          }}
                                       >
                                          {copiedVerse === idx ? (
                                             <Check className="h-4 w-4 text-green-500" />
                                          ) : (
                                             <Share2 className="h-4 w-4" />
                                          )}
                                       </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                       {copiedVerse === idx ? "Copiado!" : "Compartilhar"}
                                    </TooltipContent>
                                 </Tooltip>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
         </ScrollArea>
      </main>
   );
}