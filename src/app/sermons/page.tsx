import Link from "next/link";
import { listSermons, type Sermon } from "@/lib/sermons";
import { requireUser } from "@/lib/dal";
import { BOOKS } from "@/lib/bible-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, LogOut, BookOpen } from "lucide-react";
import { signOutAction } from "./actions";

const STATUS_LABEL: Record<Sermon["status"], string> = {
   draft: "Rascunho",
   ready: "Pronto",
   preached: "Pregado",
};

function formatPassage(sermon: Sermon) {
   const book = BOOKS.find((b) => b.id === sermon.book_id)?.name ?? sermon.book_id;
   const chapter = sermon.chapter + 1;

   if (sermon.verse_start == null) return `${book} ${chapter}`;

   const start = sermon.verse_start + 1;
   if (sermon.verse_end == null || sermon.verse_end === sermon.verse_start) {
      return `${book} ${chapter}:${start}`;
   }
   return `${book} ${chapter}:${start}-${sermon.verse_end + 1}`;
}

export default async function SermonsPage() {
   await requireUser();
   const sermons = await listSermons();

   return (
      <div className="min-h-screen bg-background">
         <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
            <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
               <Link
                  href="/"
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
               >
                  <BookOpen className="h-4 w-4" />
                  Voltar à leitura
               </Link>
               <form action={signOutAction}>
                  <Button type="submit" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                     <LogOut className="h-3.5 w-3.5" />
                     Sair
                  </Button>
               </form>
            </div>
         </header>

         <main className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
               <h1 className="text-2xl font-semibold">Meus sermões</h1>
               <Button asChild size="sm" className="gap-1.5">
                  <Link href="/sermons/new">
                     <Plus className="h-4 w-4" />
                     Novo sermão
                  </Link>
               </Button>
            </div>

            {sermons.length === 0 ? (
               <div className="text-center py-20 text-muted-foreground">
                  <p className="text-sm">Nenhum sermão ainda.</p>
                  <p className="text-xs mt-1">
                     Comece um a partir de um versículo durante a leitura, ou clique em &quot;Novo sermão&quot;.
                  </p>
               </div>
            ) : (
               <div className="grid gap-3 sm:grid-cols-2">
                  {sermons.map((sermon) => (
                     <Link key={sermon.id} href={`/sermons/${sermon.id}`}>
                        <Card className="h-full hover:border-primary/50 transition-colors">
                           <CardHeader>
                              <div className="flex items-start justify-between gap-2">
                                 <CardTitle className="text-base line-clamp-1">
                                    {sermon.title || "Sem título"}
                                 </CardTitle>
                                 <Badge variant="outline" className="shrink-0 text-[10px]">
                                    {STATUS_LABEL[sermon.status]}
                                 </Badge>
                              </div>
                              <CardDescription>{formatPassage(sermon)}</CardDescription>
                           </CardHeader>
                           <CardContent>
                              <p className="text-xs text-muted-foreground">
                                 Atualizado em {new Date(sermon.updated_at).toLocaleDateString("pt-BR")}
                              </p>
                           </CardContent>
                        </Card>
                     </Link>
                  ))}
               </div>
            )}
         </main>
      </div>
   );
}
