import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GENRES, type GenreSlug } from "@/lib/genres";
import { type EventKind } from "@/lib/validation";

type AdminEventRow = {
  id: string;
  slug: string;
  title: string;
  kind: EventKind;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  is_public: boolean;
  genres: GenreSlug[];
};

const GENRE_LABEL: Record<string, string> = Object.fromEntries(
  GENRES.map((g) => [g.slug, g.labelEn]),
);

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, slug, title, kind, starts_at, ends_at, location, is_public, genres",
      )
      .gte("starts_at", now)
      .order("starts_at", { ascending: true })
      .returns<AdminEventRow[]>(),
    supabase
      .from("events")
      .select(
        "id, slug, title, kind, starts_at, ends_at, location, is_public, genres",
      )
      .lt("starts_at", now)
      .order("starts_at", { ascending: false })
      .returns<AdminEventRow[]>(),
  ]);

  return (
    <main className="px-4 py-12 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl uppercase tracking-tight text-text-1 md:text-6xl">
          Events
        </h1>
        <Link
          href="/admin/events/new"
          className="bg-text-1 px-5 py-3 font-display text-base uppercase tracking-tight text-bg hover:opacity-80"
        >
          + new event
        </Link>
      </div>

      <Section title="Upcoming" rows={upcoming ?? []} empty="다가오는 행사 없음." />
      <Section title="Past" rows={past ?? []} empty="과거 행사 없음." />
    </main>
  );
}

function Section({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: AdminEventRow[];
  empty: string;
}) {
  return (
    <section className="mt-12">
      <h2 className="font-body text-xs uppercase tracking-widest text-text-3">
        {title} ({rows.length})
      </h2>
      {rows.length === 0 ? (
        <p className="mt-4 font-body text-sm text-text-3">{empty}</p>
      ) : (
        <ul className="mt-4 grid gap-px bg-text-3/30">
          {rows.map((row) => (
            <li key={row.id} className="bg-bg">
              <Link
                href={`/admin/events/${row.id}/edit`}
                className="grid gap-2 px-4 py-4 hover:bg-surface md:grid-cols-[160px_1fr_120px_80px] md:items-center"
              >
                <span className="font-body text-xs text-text-3">
                  {fmtDate(row.starts_at)}
                </span>
                <span className="font-display text-xl text-text-1">
                  {row.title}
                  <span className="ml-2 font-body text-xs text-text-3">
                    /{row.slug}
                  </span>
                </span>
                <span className="font-body text-xs uppercase tracking-widest text-text-2">
                  {row.kind}
                  {row.genres.length > 0 && (
                    <span className="ml-2 text-text-3">
                      {row.genres.map((g) => GENRE_LABEL[g] ?? g).join(" · ")}
                    </span>
                  )}
                </span>
                <span
                  className={`font-body text-xs uppercase tracking-widest ${
                    row.is_public ? "text-text-2" : "text-accent"
                  }`}
                >
                  {row.is_public ? "public" : "private"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
