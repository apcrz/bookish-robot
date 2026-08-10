import { notFound } from "next/navigation";
import { getSermon } from "@/lib/sermons";
import { requireUser } from "@/lib/dal";
import { SermonEditor } from "./sermon-editor";

export default async function SermonPage({
   params,
}: {
   params: Promise<{ id: string }>;
}) {
   await requireUser();
   const { id } = await params;
   const sermon = await getSermon(id);

   if (!sermon) notFound();

   return <SermonEditor sermon={sermon} />;
}
