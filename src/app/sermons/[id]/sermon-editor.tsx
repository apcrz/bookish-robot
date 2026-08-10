"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BOOKS } from "@/lib/bible-types";
import type { Sermon } from "@/lib/sermons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarkdownField } from "@/components/sermons/markdown-field";
import { ArrowLeft, Trash2, Pencil, Globe } from "lucide-react";
import { updateSermonAction, deleteSermonAction } from "../actions";

const STATUS_OPTIONS: { value: Sermon["status"]; label: string }[] = [
   { value: "draft", label: "Rascunho" },
   { value: "ready", label: "Pronto" },
   { value: "preached", label: "Pregado" },
];

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

interface SermonValues {
   title: string;
   content: string;
   status: Sermon["status"];
   is_public: boolean;
}

export function SermonEditor({ sermon }: { sermon: Sermon }) {
   const router = useRouter();
   const [mode, setMode] = useState<"view" | "edit">(sermon.status === "draft" ? "edit" : "view");
   const [savedSermon, setSavedSermon] = useState<SermonValues>({
      title: sermon.title,
      content: sermon.content,
      status: sermon.status,
      is_public: sermon.is_public,
   });

   const [title, setTitle] = useState(sermon.title);
   const [content, setContent] = useState(sermon.content);
   const [status, setStatus] = useState<Sermon["status"]>(sermon.status);
   const [saving, setSaving] = useState(false);
   const [deleting, setDeleting] = useState(false);
   const [justSaved, setJustSaved] = useState(false);
   const [sharing, setSharing] = useState(false);
   const [linkCopied, setLinkCopied] = useState(false);
   const [origin, setOrigin] = useState("");

   useEffect(() => {
      setOrigin(window.location.origin);
   }, []);

   const handleEdit = () => {
      setTitle(savedSermon.title);
      setContent(savedSermon.content);
      setStatus(savedSermon.status);
      setMode("edit");
   };

   const handleCancel = () => {
      setTitle(savedSermon.title);
      setContent(savedSermon.content);
      setStatus(savedSermon.status);
      setMode("view");
   };

   const handleSave = async (e: FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setJustSaved(false);
      await updateSermonAction(sermon.id, { title, content, status });
      setSavedSermon((s) => ({ ...s, title, content, status }));
      setSaving(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1800);
      setMode(status === "draft" ? "edit" : "view");
   };

   const handleDelete = async () => {
      if (!window.confirm("Excluir este sermão? Essa ação não pode ser desfeita.")) return;
      setDeleting(true);
      await deleteSermonAction(sermon.id);
      router.push("/sermons");
   };

   const handleTogglePublic = async () => {
      setSharing(true);
      const nextPublic = !savedSermon.is_public;
      await updateSermonAction(sermon.id, { is_public: nextPublic });
      setSavedSermon((s) => ({ ...s, is_public: nextPublic }));
      setSharing(false);
   };

   const handleCopyLink = async () => {
      try {
         await navigator.clipboard.writeText(`${window.location.origin}/s/${sermon.id}`);
         setLinkCopied(true);
         setTimeout(() => setLinkCopied(false), 1800);
      } catch {
         // ignore
      }
   };

   if (mode === "view") {
      return (
         <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
               <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                     <Link href="/sermons" className="text-muted-foreground hover:text-foreground shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                     </Link>
                     <h1 className="text-sm font-medium truncate">{formatPassage(sermon)}</h1>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleEdit}>
                        <Pencil className="h-4 w-4" />
                     </Button>
                     <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8", savedSermon.is_public ? "text-primary" : "text-muted-foreground")}
                        onClick={handleTogglePublic}
                        disabled={sharing}
                        title={savedSermon.is_public ? "Tornar privado" : "Tornar público"}
                     >
                        <Globe className="h-4 w-4" />
                     </Button>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                     >
                        <Trash2 className="h-4 w-4" />
                     </Button>
                  </div>
               </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-10">
               <div className="flex items-center gap-2 flex-wrap mb-3">
                  <h2 className="text-2xl font-semibold">{savedSermon.title || "Sem título"}</h2>
                  <Badge variant="outline" className="text-[10px]">
                     {STATUS_LABEL[savedSermon.status]}
                  </Badge>
                  {savedSermon.is_public && (
                     <Badge variant="secondary" className="text-[10px] gap-1">
                        <Globe className="h-3 w-3" />
                        Público
                     </Badge>
                  )}
               </div>

               {savedSermon.is_public && (
                  <div className="flex items-center gap-2 mb-8 flex-wrap">
                     <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-full">
                        {origin}/s/{sermon.id}
                     </code>
                     <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={handleCopyLink}>
                        {linkCopied ? "Copiado!" : "Copiar link"}
                     </Button>
                  </div>
               )}

               {savedSermon.content.trim() ? (
                  <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:mt-6 prose-headings:mb-3">
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{savedSermon.content}</ReactMarkdown>
                  </div>
               ) : (
                  <p className="text-muted-foreground text-sm italic">Este sermão ainda não tem conteúdo.</p>
               )}
            </main>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-background">
         <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
               <div className="flex items-center gap-3 min-w-0">
                  <Link href="/sermons" className="text-muted-foreground hover:text-foreground shrink-0">
                     <ArrowLeft className="h-4 w-4" />
                  </Link>
                  <h1 className="text-sm font-medium truncate">{formatPassage(sermon)}</h1>
               </div>
               <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={handleDelete}
                  disabled={deleting}
               >
                  <Trash2 className="h-4 w-4" />
               </Button>
            </div>
         </header>

         <main className="max-w-2xl mx-auto px-4 py-8">
            <form onSubmit={handleSave} className="space-y-5">
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
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as Sermon["status"])}>
                     <SelectTrigger className="w-40">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                           <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="space-y-1.5">
                  <Label htmlFor="content">Conteúdo</Label>
                  <MarkdownField
                     id="content"
                     value={content}
                     onChange={setContent}
                     minHeightClassName="min-h-100"
                  />
               </div>

               <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                     {saving ? "Salvando..." : justSaved ? "Salvo!" : "Salvar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                     Cancelar
                  </Button>
               </div>
            </form>
         </main>
      </div>
   );
}
