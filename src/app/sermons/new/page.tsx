"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BOOKS, type Translation } from "@/lib/bible-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarkdownField } from "@/components/sermons/markdown-field";
import { ArrowLeft } from "lucide-react";
import { createSermonAction } from "../actions";

function NewSermonForm() {
   const router = useRouter();
   const searchParams = useSearchParams();

   const prefilled = searchParams.get("bookId") !== null;
   const [translation] = useState<Translation>(
      (searchParams.get("translation") as Translation) ?? "nvi"
   );
   const [bookId, setBookId] = useState(searchParams.get("bookId") ?? BOOKS[0].id);
   const [chapter, setChapter] = useState(Number(searchParams.get("chapter") ?? 0));
   const verseParam = searchParams.get("verse");
   const [verseStart] = useState<number | null>(verseParam !== null ? Number(verseParam) : null);

   const [title, setTitle] = useState("");
   const [content, setContent] = useState("");
   const [saving, setSaving] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const bookName = BOOKS.find((b) => b.id === bookId)?.name ?? bookId;

   const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setError(null);

      try {
         const id = await createSermonAction({
            title,
            translation,
            bookId,
            chapter,
            verseStart,
            verseEnd: verseStart,
            content,
         });
         router.push(`/sermons/${id}`);
      } catch {
         setError("Não foi possível salvar o sermão.");
         setSaving(false);
      }
   };

   return (
      <div className="min-h-screen bg-background">
         <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
               <Link href="/sermons" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
               </Link>
               <h1 className="text-sm font-medium">Novo sermão</h1>
            </div>
         </header>

         <main className="max-w-2xl mx-auto px-4 py-8">
            <form onSubmit={handleSubmit} className="space-y-5">
               <div className="space-y-1.5">
                  <Label>Passagem</Label>
                  {prefilled ? (
                     <p className="text-sm px-3 py-2 rounded-lg border bg-muted/30">
                        {bookName} {chapter + 1}
                        {verseStart !== null && `:${verseStart + 1}`}
                     </p>
                  ) : (
                     <div className="flex gap-2">
                        <Select value={bookId} onValueChange={setBookId}>
                           <SelectTrigger className="flex-1">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              {BOOKS.map((b) => (
                                 <SelectItem key={b.id} value={b.id}>
                                    {b.name}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <Input
                           type="number"
                           min={1}
                           className="w-24"
                           value={chapter + 1}
                           onChange={(e) => setChapter(Math.max(0, Number(e.target.value) - 1))}
                        />
                     </div>
                  )}
               </div>

               <div className="space-y-1.5">
                  <Label htmlFor="title">Título</Label>
                  <Input
                     id="title"
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     placeholder="Título do sermão"
                  />
               </div>

               <div className="space-y-1.5">
                  <Label htmlFor="content">Conteúdo</Label>
                  <MarkdownField
                     id="content"
                     value={content}
                     onChange={setContent}
                     placeholder="Comece a desenvolver seu sermão..."
                     minHeightClassName="min-h-75"
                  />
               </div>

               {error && <p className="text-sm text-destructive">{error}</p>}

               <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : "Criar sermão"}
               </Button>
            </form>
         </main>
      </div>
   );
}

export default function NewSermonPage() {
   return (
      <Suspense>
         <NewSermonForm />
      </Suspense>
   );
}
