"use client";

import { useTheme } from "next-themes";
import { useBibleStore } from "@/lib/store";
import { TRANSLATIONS, Translation, BOOKS } from "@/lib/bible-types";
import { BookSelector, ChapterSelector } from "./selectors";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
   Drawer,
   DrawerContent,
   DrawerHeader,
   DrawerTitle,
   DrawerTrigger,
   DrawerClose
} from "@/components/ui/drawer";
import { BookOpen, Minus, Plus, Moon, Sun, User, Bookmark, X, Trash2 } from "lucide-react";

export function BibleHeader({ totalChapters }: { totalChapters: number }) {
   const { theme, setTheme } = useTheme();
   const {
      translation,
      setTranslation,
      setFontSize,
      bookmarks,
      setBookId,
      setChapter,
      setHighlightedVerse,
      toggleBookmark
   } = useBibleStore();

   const handleNavigateToBookmark = (bookmarkKey: string) => {
      const parts = bookmarkKey.split("_");

      const bId = parts[0];
      const ch = parseInt(parts[1], 10);
      const vs = parseInt(parts[2], 10);

      if (bId && !isNaN(ch)) {
         setBookId(bId);
         setChapter(ch);
         if (!isNaN(vs)) {
            setHighlightedVerse(vs);
            setTimeout(() => {
               document.getElementById(`verse-${vs}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 200);
         }
      }
   };

   const getBookName = (id: string) => BOOKS.find(b => b.id === id)?.name || id;

   return (
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
         <div className="max-w-3xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
               <BookOpen className="h-5 w-5 text-primary shrink-0 ml-1" />

               <div className="flex-1 min-w-0">
                  <BookSelector />
               </div>

               <ChapterSelector totalChapters={totalChapters} />
            </div>

            <div className="flex items-center gap-1 shrink-0">
               <Select value={translation} onValueChange={(v) => setTranslation(v as Translation)}>
                  <SelectTrigger className="w-[58px] h-8 text-xs font-mono bg-background">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                     {TRANSLATIONS.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                           <span className="font-mono uppercase tracking-widest">{t.id}</span>
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>

               <div className="hidden sm:flex items-center gap-0.5">
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8"
                           onClick={() => setFontSize((s) => Math.max(13, s - 1))}
                        >
                           <Minus className="h-3.5 w-3.5" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Diminuir fonte</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8"
                           onClick={() => setFontSize((s) => Math.min(24, s + 1))}
                        >
                           <Plus className="h-3.5 w-3.5" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Aumentar fonte</TooltipContent>
                  </Tooltip>
               </div>

               <Drawer direction="right">
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <DrawerTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Bookmark className="h-4 w-4" />
                           </Button>
                        </DrawerTrigger>
                     </TooltipTrigger>
                     <TooltipContent>Favoritos</TooltipContent>
                  </Tooltip>

                  <DrawerContent className="fixed inset-y-0 right-0 left-auto z-50 flex h-full w-[320px] sm:w-[380px] flex-col border-l bg-background rounded-none shadow-2xl">
                     <DrawerHeader className="flex items-center justify-between border-b pb-4 pt-5 px-4 bg-muted/20">
                        <DrawerTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                           <Bookmark className="h-4 w-4 text-primary fill-primary/10" />
                           Favoritos ({bookmarks.length})
                        </DrawerTitle>
                        <DrawerClose asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-accent">
                              <X className="h-4 w-4" />
                           </Button>
                        </DrawerClose>
                     </DrawerHeader>

                     <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-background">
                        {bookmarks.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                              <Bookmark className="h-10 w-10 stroke-[1.2] mb-3 opacity-30 text-primary" />
                              <p className="text-sm font-medium">Nenhum favorito por aqui</p>
                              <p className="text-xs opacity-70 mt-1 max-w-[200px]">
                                 Toque nos versículos durante a leitura para salvá-los nesta lista.
                              </p>
                           </div>
                        ) : (
                           bookmarks.map((key) => {
                              // Corrigido para o seu formato real: "nvi:rm:0:0"
                              const parts = key.split(":");
                              const transId = parts[0];
                              const bId = parts[1];
                              const chZeroIndexed = parseInt(parts[2], 10);
                              const vsZeroIndexed = parseInt(parts[3], 10);

                              const bookMeta = BOOKS.find((b) => b.id === bId);
                              const isNT = bookMeta?.testament === "NT";

                              // Se o seu componente de texto renderiza os IDs dos versículos como 1-indexed (ex: id="verse-1")
                              const displayChapter = chZeroIndexed + 1;
                              const displayVerse = vsZeroIndexed + 1;

                              return (
                                 <div
                                    key={key}
                                    className={`group relative flex items-center justify-between p-3 rounded-r-lg border border-l-2 bg-card hover:bg-accent/40 transition-all shadow-sm ${isNT ? "border-l-sky-500/80" : "border-l-amber-600/80"
                                       }`}
                                 >
                                    <DrawerClose asChild>
                                       <div
                                          className="flex-1 min-w-0 cursor-pointer pr-2"
                                          onClick={() => {
                                             setBookId(bId);
                                             setChapter(chZeroIndexed);
                                             if (!isNaN(vsZeroIndexed)) {
                                                // Passa o número correto para o highlight (ajuste se seu store usar 0-indexed no highlight)
                                                setHighlightedVerse(displayVerse);
                                                setTimeout(() => {
                                                   document
                                                      .getElementById(`verse-${displayVerse}`)
                                                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                                                }, 200);
                                             }
                                          }}
                                       >
                                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                             <span className="font-semibold text-sm text-foreground tracking-tight">
                                                {bookMeta?.name || bId} {displayChapter}
                                                {!isNaN(vsZeroIndexed) && `:${displayVerse}`}
                                             </span>

                                             <span
                                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase border ${isNT
                                                      ? "bg-sky-500/5 text-sky-600 dark:text-sky-400 border-sky-500/10"
                                                      : "bg-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-500/10"
                                                   }`}
                                             >
                                                {bookMeta?.testament || "AT"}
                                             </span>

                                             <span className="text-[9px] font-mono font-medium uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded border">
                                                {transId}
                                             </span>
                                          </div>
                                          <p className="text-xs text-muted-foreground/80 truncate">
                                             Ir para este capítulo
                                          </p>
                                       </div>
                                    </DrawerClose>

                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       className="h-8 w-8 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          toggleBookmark(key);
                                       }}
                                    >
                                       <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                 </div>
                              );
                           })
                        )}
                     </div>
                  </DrawerContent>
               </Drawer>

               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                     >
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>Alternar tema</TooltipContent>
               </Tooltip>

               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-8 w-8">
                        <User className="h-4 w-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>Minha conta</TooltipContent>
               </Tooltip>
            </div>
         </div>
      </header>
   );
}