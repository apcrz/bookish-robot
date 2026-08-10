import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import type { Translation } from "@/lib/bible-types";

export interface Sermon {
  id: string;
  title: string;
  translation: Translation;
  book_id: string;
  chapter: number;
  verse_start: number | null;
  verse_end: number | null;
  content: string;
  status: "draft" | "ready" | "preached";
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewSermonInput {
  title: string;
  translation: Translation;
  bookId: string;
  chapter: number;
  verseStart?: number | null;
  verseEnd?: number | null;
  content?: string;
}

export interface SermonPatch {
  title?: string;
  content?: string;
  status?: Sermon["status"];
  is_public?: boolean;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listSermons(): Promise<Sermon[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sermons")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data as Sermon[];
}

export async function getSermon(id: string): Promise<Sermon | null> {
  if (!UUID_RE.test(id)) return null;

  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sermons")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data as Sermon | null;
}

export async function getPublicSermon(id: string): Promise<Sermon | null> {
  if (!UUID_RE.test(id)) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sermons")
    .select("*")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();

  if (error) throw error;
  return data as Sermon | null;
}

export async function createSermon(input: NewSermonInput): Promise<Sermon> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sermons")
    .insert({
      user_id: user.id,
      title: input.title,
      translation: input.translation,
      book_id: input.bookId,
      chapter: input.chapter,
      verse_start: input.verseStart ?? null,
      verse_end: input.verseEnd ?? null,
      content: input.content ?? "",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Sermon;
}

export async function updateSermon(id: string, patch: SermonPatch): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("sermons")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function deleteSermon(id: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("sermons")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}
