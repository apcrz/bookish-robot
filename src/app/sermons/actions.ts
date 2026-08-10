"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
   createSermon as createSermonRecord,
   updateSermon as updateSermonRecord,
   deleteSermon as deleteSermonRecord,
   type NewSermonInput,
   type SermonPatch,
} from "@/lib/sermons";

export async function createSermonAction(input: NewSermonInput) {
   const sermon = await createSermonRecord(input);
   revalidatePath("/sermons");
   return sermon.id;
}

export async function updateSermonAction(id: string, patch: SermonPatch) {
   await updateSermonRecord(id, patch);
   revalidatePath(`/sermons/${id}`);
   revalidatePath("/sermons");
}

export async function deleteSermonAction(id: string) {
   await deleteSermonRecord(id);
   revalidatePath("/sermons");
}

export async function signOutAction() {
   const supabase = await createClient();
   await supabase.auth.signOut();
   redirect("/login");
}
