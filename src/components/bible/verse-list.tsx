// src/components/bible/verse-list.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { bookmarkKey, useBibleStore } from "@/lib/store";
import { BOOKS } from "@/lib/bible-types";
import type { ChapterSermon } from "@/lib/use-chapter-sermons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bookmark, Copy, Check, NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerseListProps {
   data: any;
   loading: boolean;
   error: string | null;
   sermons: ChapterSermon[];
}

export function VerseList({ data, loading, error, sermons }: VerseListProps) {
   const router = useRouter();
   const scrollRef = useRef<HTMLDivElement>(null);
   const [copiedVerse, setCopiedVerse] = useState<number | null>(null);

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

   // Índices favoritados deste capítulo. Set em vez de varrer a lista inteira a
   // cada versículo, e é ele que responde se o vizinho de cima/baixo também está
   // salvo — o que decide onde a faixa começa e termina.
   const bookmarkedVerses = useMemo(() => {
      const prefix = `${bookId}:${chapter}:`;
      const indices = new Set<number>();
      for (const b of bookmarks) {
         if (!b.key.startsWith(prefix)) continue;
         const idx = Number(b.key.slice(prefix.length));
         if (Number.isInteger(idx)) indices.add(idx);
      }
      return indices;
   }, [bookmarks, bookId, chapter]);

   const chapterSermons = sermons.filter((s) => s.verse_start == null);
   const findSermonForVerse = (idx: number) =>
      sermons.find(
         (s) => s.verse_start != null && idx >= s.verse_start && idx <= (s.verse_end ?? s.verse_start)
      );

   // Trocou de capítulo: volta pro topo. A não ser que a navegação tenha vindo
   // de um favorito, que já traz um versículo alvo — aí manda o efeito de baixo.
   // getState() em vez do valor do render: só interessa o instante da troca.
   useEffect(() => {
      if (useBibleStore.getState().highlightedVerse !== null) return;
      scrollRef.current?.scrollTo({ top: 0 });
   }, [chapter, bookId]);

   // Rolar até o versículo é de quem é dono do container de scroll. Só rola se
   // ele não estiver visível, senão tocar num versículo à vista faria a tela
   // pular sozinha. Depende de `data` pra reagir quando o livro novo chega.
   useEffect(() => {
      if (highlightedVerse === null) return;

      const viewport = scrollRef.current;
      const el = document.getElementById(`verse-${highlightedVerse}`);
      if (!viewport || !el) return;

      const elBox = el.getBoundingClientRect();
      const viewBox = viewport.getBoundingClientRect();
      if (elBox.top >= viewBox.top && elBox.bottom <= viewBox.bottom) return;

      el.scrollIntoView({ behavior: "smooth", block: "center" });
   }, [highlightedVerse, chapter, bookId, data]);

   // Copiar, não compartilhar: isso é pra colar o versículo num sermão seu,
   // não pra mandar pra fora. Web Share e os fallbacks de execCommand saíram.
   const handleCopy = async (verseText: string, verseIndex: number) => {
      const bookName = currentBook?.name || "Bíblia";
      const reference = `${bookName} ${chapter + 1}:${verseIndex + 1}`;
      const text = `"${verseText}"\n— ${reference} (${translation.toUpperCase()})`;

      try {
         await navigator.clipboard.writeText(text);
         setCopiedVerse(verseIndex);
         setTimeout(() => setCopiedVerse(null), 1800);
      } catch {
         // Sem clipboard não tem plano B honesto — melhor não dar o check
         // verde do que fingir que copiou.
      }
   };
   return (
      <main className="flex-1 overflow-hidden bg-background">
         <ScrollArea viewportRef={scrollRef} className="h-[calc(100vh-108px)]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">

               <div className="mb-8 md:mb-12 text-center">
                  <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                     {currentBook?.name}
                  </h1>
                  <p className="mt-1 text-xl md:text-2xl text-muted-foreground">
                     Capítulo {chapter + 1}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                     <Badge variant="outline" className="text-xs tracking-widest">
                        {translation.toUpperCase()}
                     </Badge>

                     {chapterSermons.length > 0 && (
                        <Link
                           href={
                              chapterSermons.length === 1 ? `/sermons/${chapterSermons[0].id}` : "/sermons"
                           }
                        >
                           <Badge
                              variant="secondary"
                              className="text-xs gap-1 cursor-pointer hover:bg-secondary/80"
                           >
                              <NotebookPen className="h-3 w-3" />
                              {chapterSermons.length === 1
                                 ? "1 sermão neste capítulo"
                                 : `${chapterSermons.length} sermões neste capítulo`}
                           </Badge>
                        </Link>
                     )}
                  </div>
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
                  <div>
                     {verses.map((verse: string, idx: number) => {
                        const isHighlighted = highlightedVerse === idx;
                        const key = bookmarkKey(bookId, chapter, idx);
                        const isBookmarked = bookmarkedVerses.has(idx);
                        const prevBookmarked = bookmarkedVerses.has(idx - 1);
                        const nextBookmarked = bookmarkedVerses.has(idx + 1);
                        const sermonForVerse = findSermonForVerse(idx);

                        return (
                           <div
                              key={idx}
                              id={`verse-${idx}`}
                              onClick={() => setHighlightedVerse(isHighlighted ? null : idx)}
                              className={cn(
                                 "group relative flex gap-4 px-4 py-5 transition-all active:bg-muted/60",
                                 // Borda em todos, transparente por padrão: favoritar só troca a
                                 // cor, então o texto não pula 4px pro lado ao marcar/desmarcar.
                                 "border-l-4 border-transparent",
                                 // O vão entre favoritos contíguos some. É isso que transforma as
                                 // bordas soltas numa faixa só.
                                 idx > 0 && !(isBookmarked && prevBookmarked) && "mt-5 md:mt-8",
                                 isBookmarked
                                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                                    : "hover:bg-muted/40 md:hover:bg-muted/50",
                                 // Só as pontas do bloco arredondam; o miolo fica reto pra emendar.
                                 isBookmarked
                                    ? cn(!prevBookmarked && "rounded-t-xl", !nextBookmarked && "rounded-b-xl")
                                    : "rounded-xl",
                                 // Destaque é estado passageiro (um toque), então mora no fundo. A
                                 // borda ficou reservada pro favorito, que é permanente.
                                 isHighlighted && "bg-primary/15 dark:bg-primary/20"
                              )}
                           >
                              <div className="shrink-0 w-7 pt-0.5 flex flex-col items-center gap-1">
                                 <span className="verse-number text-base font-medium tabular-nums">
                                    {idx + 1}
                                 </span>
                                 {sermonForVerse && (
                                    <Link
                                       href={`/sermons/${sermonForVerse.id}`}
                                       onClick={(e) => e.stopPropagation()}
                                       title="Ver sermão"
                                    >
                                       <NotebookPen className="h-3 w-3 text-primary" />
                                    </Link>
                                 )}
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
                                             toggleBookmark(key, verse, translation);
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
                                             handleCopy(verse, idx);
                                          }}
                                       >
                                          {copiedVerse === idx ? (
                                             <Check className="h-4 w-4 text-green-500" />
                                          ) : (
                                             <Copy className="h-4 w-4" />
                                          )}
                                       </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                       {copiedVerse === idx ? "Copiado!" : "Copiar"}
                                    </TooltipContent>
                                 </Tooltip>

                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                       <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 -mr-1"
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             if (sermonForVerse) {
                                                router.push(`/sermons/${sermonForVerse.id}`);
                                             } else {
                                                router.push(
                                                   `/sermons/new?translation=${translation}&bookId=${bookId}&chapter=${chapter}&verse=${idx}`
                                                );
                                             }
                                          }}
                                       >
                                          <NotebookPen
                                             className={cn("h-4 w-4", sermonForVerse && "text-primary")}
                                          />
                                       </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                       {sermonForVerse ? "Ver sermão" : "Iniciar sermão"}
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