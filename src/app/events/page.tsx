import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { GENRES, type GenreSlug } from "@/lib/genres";
import { type EventKind } from "@/lib/validation";
import { SectionMarker } from "../_components/SectionMarker";

export const metadata: Metadata = {
  title: "Events — Real Lunatic",
  description: "Real Lunatic 행사 연혁 + 다가오는 행사.",
};

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  kind: EventKind;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  description: string | null;
  genres: GenreSlug[];
};

const GENRE_LABEL: Record<string, string> = Object.fromEntries(
  GENRES.map((g) => [g.slug, g.labelEn]),
);

const KIND_LABEL: Record<EventKind, string> = {
  performance: "공연",
  battle: "배틀",
  workshop: "워크숍",
  session: "세션",
  other: "기타",
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EventsPage() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, slug, title, kind, starts_at, ends_at, location, description, genres",
      )
      .eq("is_public", true)
      .gte("starts_at", now)
      .order("starts_at", { ascending: true })
      .returns<EventRow[]>(),
    supabase
      .from("events")
      .select(
        "id, slug, title, kind, starts_at, ends_at, location, description, genres",
      )
      .eq("is_public", true)
      .lt("starts_at", now)
      .order("starts_at", { ascending: false })
      .returns<EventRow[]>(),
  ]);

  const upcomingRows = upcoming ?? [];
  const pastRows = past ?? [];
  const isEmpty = upcomingRows.length === 0 && pastRows.length === 0;

  return (
    <main>
      <section
        aria-labelledby="events-title"
        className="relative flex min-h-[70svh] flex-col justify-end px-4 pt-32 pb-16 md:px-8 md:pb-24"
      >
        <SectionMarker number="00" label="events" />
        <h1
          id="events-title"
          className="font-display text-[18vw] leading-[0.85] tracking-tight text-text-1 md:text-[14vw]"
        >
          EVENTS
        </h1>
        <p className="mt-6 max-w-xl font-body text-base text-text-2 md:mt-10 md:text-xl">
          정기 공연 · 외부 행사 · 배틀.
          <br />
          시간순으로 쌓이는 동아리 연혁.
        </p>
      </section>

      {isEmpty ? (
        <EmptyEvents />
      ) : (
        <>
          {upcomingRows.length > 0 && (
            <EventGroup
              number="01"
              label="upcoming"
              title="UPCOMING"
              rows={upcomingRows}
            />
          )}
          {pastRows.length > 0 && (
            <EventGroup
              number={upcomingRows.length > 0 ? "02" : "01"}
              label="past"
              title="PAST"
              rows={pastRows}
            />
          )}
        </>
      )}
    </main>
  );
}

function EventGroup({
  number,
  label,
  title,
  rows,
}: {
  number: string;
  label: string;
  title: string;
  rows: EventRow[];
}) {
  return (
    <section className="border-t border-text-3/30 px-4 py-20 md:px-8 md:py-28">
      <SectionMarker number={number} label={label} />
      <h2 className="font-display text-5xl tracking-tight text-text-1 md:text-7xl">
        {title}
      </h2>
      <ul className="mt-12 grid gap-px bg-text-3/30">
        {rows.map((row) => (
          <li key={row.id} className="bg-bg px-4 py-8 md:px-8 md:py-10">
            <div className="grid gap-4 md:grid-cols-[200px_1fr] md:gap-12">
              <div className="font-body text-xs uppercase tracking-widest text-text-3">
                {fmtDate(row.starts_at)}
                {row.location && (
                  <>
                    <br />
                    <span className="text-text-2">{row.location}</span>
                  </>
                )}
              </div>
              <div>
                <h3 className="font-display text-3xl tracking-tight text-text-1 md:text-5xl">
                  {row.title}
                </h3>
                <div className="mt-3 font-body text-xs uppercase tracking-widest text-text-3">
                  {KIND_LABEL[row.kind]}
                  {row.genres.length > 0 && (
                    <span className="ml-3 text-text-2">
                      {row.genres.map((g) => GENRE_LABEL[g] ?? g).join(" · ")}
                    </span>
                  )}
                </div>
                {row.description && (
                  <p className="mt-4 max-w-2xl whitespace-pre-line font-body text-base text-text-2 md:text-lg">
                    {row.description}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyEvents() {
  return (
    <section className="border-t border-text-3/30 px-4 py-24 md:px-8 md:py-32">
      <div className="font-body text-text-3">
        <span
          className="size-1.5 inline-block bg-accent align-middle"
          aria-hidden
        />
        <span className="ml-3 align-middle text-xs uppercase tracking-widest">
          upcoming events tba
        </span>
      </div>
      <p className="mt-6 max-w-2xl font-body text-base text-text-2 md:text-lg">
        다가오는 행사는 인스타에서 먼저 공지됩니다. 새 행사가 잡히면 여기에
        라인업과 영상이 함께 올라옵니다.
      </p>
    </section>
  );
}
