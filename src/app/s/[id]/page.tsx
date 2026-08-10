import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublicSermon } from "@/lib/sermons";
import { BOOKS } from "@/lib/bible-types";
import { Badge } from "@/components/ui/badge";
import type { Sermon } from "@/lib/sermons";

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

export default async function PublicSermonPage({
   params,
}: {
   params: Promise<{ id: string }>;
}) {
   const { id } = await params;
   const sermon = await getPublicSermon(id);

   if (!sermon) notFound();

   return (
      <div className="min-h-screen bg-background">
         <main className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
            <div className="mb-8">
               <Badge variant="outline" className="text-xs tracking-widest mb-3">
                  {formatPassage(sermon)}
               </Badge>
               <h1 className="text-3xl font-semibold tracking-tight">{sermon.title || "Sem título"}</h1>
            </div>

            {sermon.content.trim() ? (
               <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:mt-6 prose-headings:mb-3">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{sermon.content}</ReactMarkdown>
               </div>
            ) : (
               <p className="text-muted-foreground text-sm italic">Este sermão ainda não tem conteúdo.</p>
            )}
         </main>
      </div>
   );
}
