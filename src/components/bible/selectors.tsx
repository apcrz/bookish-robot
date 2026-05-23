// components/bible/selectors.tsx
"use client";

import { useState } from "react";
import { useBibleStore } from "@/lib/store";
import { BOOKS } from "@/lib/bible-types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
   Sheet,
   SheetContent,
   SheetHeader,
   SheetTitle,
   SheetTrigger,
} from "@/components/ui/sheet";
import { List } from "lucide-react";

const AT_BOOKS = BOOKS.filter((b) => b.testament === "AT");
const NT_BOOKS = BOOKS.filter((b) => b.testament === "NT");

export function BookSelector() {
   const [open, setOpen] = useState(false);
   const { bookId, setBookId } = useBibleStore();
   const currentBook = BOOKS.find((b) => b.id === bookId);

   const handleSelect = (id: string) => {
      setBookId(id);
      setOpen(false);
   };

   return (
      <Sheet open={open} onOpenChange={setOpen}>
         <SheetTrigger asChild>
            <Button variant="ghost" className="font-semibold text-base px-2 truncate max-w-[140px]">
               {currentBook?.name ?? "Livro"}
            </Button>
         </SheetTrigger>
         <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="px-4 pt-4 pb-2">
               <SheetTitle>Escolher Livro</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-80px)]">
               <div className="px-4 pb-8">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 mt-2">
                     Antigo Testamento
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                     {AT_BOOKS.map((b) => (
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
                  <Separator className="my-3" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                     Novo Testamento
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                     {NT_BOOKS.map((b) => (
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