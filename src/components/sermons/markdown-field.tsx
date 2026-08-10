"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MarkdownFieldProps {
   id?: string;
   value: string;
   onChange: (value: string) => void;
   placeholder?: string;
   minHeightClassName?: string;
}

export function MarkdownField({
   id,
   value,
   onChange,
   placeholder,
   minHeightClassName = "min-h-[300px]",
}: MarkdownFieldProps) {
   const [mode, setMode] = useState<"write" | "preview">("write");

   return (
      <div>
         <div className="flex gap-1 mb-2">
            <Button
               type="button"
               variant={mode === "write" ? "default" : "outline"}
               size="sm"
               className="h-7 text-xs"
               onClick={() => setMode("write")}
            >
               Escrever
            </Button>
            <Button
               type="button"
               variant={mode === "preview" ? "default" : "outline"}
               size="sm"
               className="h-7 text-xs"
               onClick={() => setMode("preview")}
            >
               Pré-visualizar
            </Button>
         </div>

         {mode === "write" ? (
            <Textarea
               id={id}
               value={value}
               onChange={(e) => onChange(e.target.value)}
               placeholder={placeholder}
               className={cn("font-mono text-sm", minHeightClassName)}
            />
         ) : (
            <div
               className={cn(
                  "rounded-lg border px-3.5 py-3 prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2",
                  minHeightClassName
               )}
            >
               {value.trim() ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
               ) : (
                  <p className="text-muted-foreground text-sm italic">Nada para pré-visualizar ainda.</p>
               )}
            </div>
         )}

         <p className="mt-1.5 text-[11px] text-muted-foreground">
            Suporta Markdown: **negrito**, *itálico*, # títulos, - listas, {">"} citações.
         </p>
      </div>
   );
}
