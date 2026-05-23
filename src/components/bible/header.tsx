// components/bible/header.tsx
"use client";

import { useTheme } from "next-themes";
import { useBibleStore } from "@/lib/store";
import { TRANSLATIONS, Translation } from "@/lib/bible-types";
import { BookSelector, ChapterSelector } from "./selectors";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BookOpen, Minus, Plus, Moon, Sun } from "lucide-react";

export function BibleHeader({ totalChapters }: { totalChapters: number }) {
   const { theme, setTheme } = useTheme();
   const { translation, setTranslation, setFontSize } = useBibleStore();

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
            </div>
         </div>
      </header>
   );
}