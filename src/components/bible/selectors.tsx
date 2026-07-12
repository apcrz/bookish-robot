// components/bible/selectors.tsx
"use client";

import { useMemo, useState } from "react";
import { useBibleStore } from "@/lib/store";
import { BOOKS, BookMeta } from "@/lib/bible-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
   Sheet,
   SheetContent,
   SheetHeader,
   SheetTitle,
   SheetTrigger,
} from "@/components/ui/sheet";
import { List, Search, ArrowDownAZ, BookOpenText } from "lucide-react";

const AT_BOOKS = BOOKS.filter((b) => b.testament === "AT");
const NT_BOOKS = BOOKS.filter((b) => b.testament === "NT");

type SortMode = "traditional" | "alphabetical";

function normalize(value: string) {
   return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function filterAndSort(books: BookMeta[], query: string, sortMode: SortMode) {
   const filtered = query
      ? books.filter((b) => normalize(b.name).includes(normalize(query)))
      : books;

   if (sortMode === "alphabetical") {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
   }
   return filtered;
}

export function BookSelector() {
   const [open, setOpen] = useState(false);
   const [query, setQuery] = useState("");
   const [sortMode, setSortMode] = useState<SortMode>("traditional");
   const { bookId, setBookId } = useBibleStore();
   const currentBook = BOOKS.find((b) => b.id === bookId);

   const atBooks = useMemo(() => filterAndSort(AT_BOOKS, query, sortMode), [query, sortMode]);
   const ntBooks = useMemo(() => filterAndSort(NT_BOOKS, query, sortMode), [query, sortMode]);
   const hasResults = atBooks.length > 0 || ntBooks.length > 0;

   const handleSelect = (id: string) => {
      setBookId(id);
      setOpen(false);
   };

   const handleOpenChange = (next: boolean) => {
      setOpen(next);
      if (!next) setQuery("");
   };

   return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
         <SheetTrigger asChild>
            <Button variant="ghost" className="font-semibold text-base px-2 truncate max-w-[140px]">
               {currentBook?.name ?? "Livro"}
            </Button>
         </SheetTrigger>
         <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="px-4 pt-4 pb-2">
               <SheetTitle>Escolher Livro</SheetTitle>
            </SheetHeader>

            <div className="px-4 pb-2 space-y-2">
               <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                     value={query}
                     onChange={(e) => setQuery(e.target.value)}
                     placeholder="Buscar livro..."
                     className="h-9 pl-8"
                  />
               </div>

               <div className="flex gap-1">
                  <Button
                     variant={sortMode === "traditional" ? "default" : "outline"}
                     size="sm"
                     className="flex-1 h-8 text-xs gap-1.5"
                     onClick={() => setSortMode("traditional")}
                  >
                     <BookOpenText className="h-3.5 w-3.5" />
                     Tradicional
                  </Button>
                  <Button
                     variant={sortMode === "alphabetical" ? "default" : "outline"}
                     size="sm"
                     className="flex-1 h-8 text-xs gap-1.5"
                     onClick={() => setSortMode("alphabetical")}
                  >
                     <ArrowDownAZ className="h-3.5 w-3.5" />
                     A-Z
                  </Button>
               </div>
            </div>

            <ScrollArea className="h-[calc(100vh-172px)]">
               <div className="px-4 pb-8">
                  {atBooks.length > 0 && (
                     <>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 mt-2">
                           Antigo Testamento
                        </p>
                        <div className="flex flex-col gap-1">
                           {atBooks.map((b) => (
                              <Button
                                 key={b.id}
                                 variant={bookId === b.id ? "default" : "ghost"}
                                 className="justify-start text-sm h-9"
                                 onClick={() => handleSelect(b.id)}
                              >
                                 {b.name}
                              </Button>
                           ))}
                        </div>
                     </>
                  )}

                  {atBooks.length > 0 && ntBooks.length > 0 && <Separator className="my-3" />}

                  {ntBooks.length > 0 && (
                     <>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                           Novo Testamento
                        </p>
                        <div className="flex flex-col gap-1">
                           {ntBooks.map((b) => (
                              <Button
                                 key={b.id}
                                 variant={bookId === b.id ? "default" : "ghost"}
                                 className="justify-start text-sm h-9"
                                 onClick={() => handleSelect(b.id)}
                              >
                                 {b.name}
                              </Button>
                           ))}
                        </div>
                     </>
                  )}

                  {!hasResults && (
                     <div className="text-center py-10 text-sm text-muted-foreground">
                        Nenhum livro encontrado.
                     </div>
                  )}
               </div>
            </ScrollArea>
         </SheetContent>
      </Sheet>
   );
}

export function ChapterSelector({ totalChapters }: { totalChapters: number }) {
   const [open, setOpen] = useState(false);
   const { chapter, bookId, setChapter } = useBibleStore();
   const currentBook = BOOKS.find((b) => b.id === bookId);

   if (totalChapters === 0) return null;

   return (
      <Sheet open={open} onOpenChange={setOpen}>
         <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="px-3 text-sm">
               <List className="h-3.5 w-3.5 mr-1.5" />
               Cap. {chapter + 1}
            </Button>
         </SheetTrigger>
         <SheetContent side="bottom" className="h-[60vh]">
            <SheetHeader>
               <SheetTitle>Capítulos — {currentBook?.name}</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(60vh-80px)] mt-4">
               <div className="grid grid-cols-5 gap-2 pb-4">
                  {Array.from({ length: totalChapters }, (_, i) => (
                     <Button
                        key={i}
                        variant={chapter === i ? "default" : "outline"}
                        className="aspect-square"
                        onClick={() => {
                           setChapter(i);
                           setOpen(false);
                        }}
                     >
                        {i + 1}
                     </Button>
                  ))}
               </div>
            </ScrollArea>
         </SheetContent>
      </Sheet>
   );
}