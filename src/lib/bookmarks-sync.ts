import { createClient } from "@/lib/supabase/client";
import { bookmarkKey, type Bookmark, type PendingOp } from "@/lib/store";
import type { Translation } from "@/lib/bible-types";

interface BookmarkRow {
  book_id: string;
  chapter: number;
  verse: number;
  translation: Translation;
  text: string;
  created_at: string;
}

// chapter e verse são 0-indexed na tabela, igual à `sermons`. Converter só na
// exibição evita a família de bugs de ±1 que já apareceu uma vez aqui.
function parseKey(key: string) {
  const [bookId, chapter, verse] = key.split(":");
  return { bookId, chapter: Number(chapter), verse: Number(verse) };
}

function rowToBookmark(row: BookmarkRow): Bookmark {
  return {
    key: bookmarkKey(row.book_id, row.chapter, row.verse),
    text: row.text,
    translation: row.translation,
    createdAt: row.created_at,
  };
}

const byNewest = (a: Bookmark, b: Bookmark) => b.createdAt.localeCompare(a.createdAt);

/** Sobe a fila de pendências. Devolve as chaves que podem sair da fila. */
export async function pushPending(
  userId: string,
  pending: PendingOp[],
  bookmarks: Bookmark[]
): Promise<string[]> {
  const supabase = createClient();
  const resolved: string[] = [];

  const adds = pending.filter((p) => p.op === "add");
  const rows = adds.flatMap((p) => {
    const b = bookmarks.find((x) => x.key === p.key);
    if (!b) return [];
    const { bookId, chapter, verse } = parseKey(p.key);
    return [{
      user_id: userId,
      book_id: bookId,
      chapter,
      verse,
      translation: b.translation,
      text: b.text,
      created_at: b.createdAt,
    }];
  });

  if (rows.length) {
    // upsert: favoritar o mesmo versículo em dois aparelhos não vira erro nem
    // linha duplicada — a unique (user_id, book_id, chapter, verse) resolve.
    const { error } = await supabase
      .from("bookmarks")
      .upsert(rows, { onConflict: "user_id,book_id,chapter,verse" });
    if (error) throw error;
  }
  resolved.push(...adds.map((p) => p.key));

  // Remoções vão uma a uma: a chave é composta, não dá pra usar .in(). Na
  // prática é quase sempre uma só.
  for (const p of pending.filter((p) => p.op === "remove")) {
    const { bookId, chapter, verse } = parseKey(p.key);
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .eq("chapter", chapter)
      .eq("verse", verse);
    if (error) throw error;
    resolved.push(p.key);
  }

  return resolved;
}

export async function pullAll(userId: string): Promise<Bookmark[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .select("book_id, chapter, verse, translation, text, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as BookmarkRow[]).map(rowToBookmark);
}

/**
 * Reaplica por cima do que veio do servidor as pendências que entraram enquanto
 * a busca estava no ar. Sem isso, favoritar durante a sincronização faria o
 * favorito piscar e sumir até a próxima rodada.
 */
export function applyPendingOver(
  remote: Bookmark[],
  pending: PendingOp[],
  local: Bookmark[]
): Bookmark[] {
  if (!pending.length) return remote;

  const byKey = new Map(remote.map((b) => [b.key, b]));
  for (const p of pending) {
    if (p.op === "remove") {
      byKey.delete(p.key);
      continue;
    }
    const b = local.find((x) => x.key === p.key);
    if (b) byKey.set(p.key, b);
  }

  return [...byKey.values()].sort(byNewest);
}
