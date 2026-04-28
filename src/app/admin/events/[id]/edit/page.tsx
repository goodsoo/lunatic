import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type GenreSlug } from "@/lib/genres";
import { type EventKind } from "@/lib/validation";
import { EventForm } from "../../EventForm";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  kind: EventKind;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  description: string | null;
  is_public: boolean;
  genres: GenreSlug[];
};

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select(
      "id, slug, title, kind, starts_at, ends_at, location, description, is_public, genres",
    )
    .eq("id", id)
    .maybeSingle<EventRow>();

  if (!event) notFound();

  return (
    <main className="px-4 py-12 md:px-8">
      <h1 className="font-display text-4xl uppercase tracking-tight text-text-1 md:text-6xl">
        Edit event
      </h1>
      <p className="mt-3 font-body text-xs uppercase tracking-widest text-text-3">
        /{event.slug}
      </p>
      <div className="mt-12">
        <EventForm initial={event} />
      </div>
    </main>
  );
}
