import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GENRES, type GenreSlug } from "@/lib/genres";
import { SectionMarker } from "../_components/SectionMarker";

export const metadata: Metadata = {
  title: "Dancers — Real Lunatic",
  description: "Real Lunatic 댄서 갤러리.",
};

type DancerRow = {
  id: string;
  dancer_name: string;
  cohort: number;
  avatar_url: string | null;
  instagram_handle: string | null;
  bio: string | null;
  type: "undergrad" | "grad" | "other";
};

type GenreLink = { member_id: string; genre: GenreSlug; is_primary: boolean };

export default async function DancersPage({
  searchParams,
}: {
  searchParams: Promise<{ g?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/error?reason=login_required");

  const { data: meRow } = await supabase
    .from("members")
    .select("application_status")
    .eq("id", user.id)
    .maybeSingle<{ application_status: "pending" | "approved" | "rejected" }>();

  if (!meRow) redirect("/signup");
  if (meRow.application_status !== "approved") {
    redirect("/signup/pending");
  }

  const { g } = await searchParams;
  const activeGenre =
    g && GENRES.some((x) => x.slug === g) ? (g as GenreSlug) : null;

  const { data: dancersRaw } = await supabase
    .from("dancers_member")
    .select("id, dancer_name, cohort, avatar_url, instagram_handle, bio, type")
    .order("cohort", { ascending: false })
    .order("dancer_name", { ascending: true });

  const dancers = (dancersRaw ?? []) as DancerRow[];

  const ids = dancers.map((d) => d.id);
  const { data: genreRowsRaw } =
    ids.length > 0
      ? await supabase
          .from("member_genres")
          .select("member_id, genre, is_primary")
          .in("member_id", ids)
      : { data: [] as GenreLink[] };

  const genreRows = (genreRowsRaw ?? []) as GenreLink[];
  const genresByMember = new Map<string, GenreLink[]>();
  for (const row of genreRows) {
    const list = genresByMember.get(row.member_id) ?? [];
    list.push(row);
    genresByMember.set(row.member_id, list);
  }

  const filtered = activeGenre
    ? dancers.filter((d) =>
        (genresByMember.get(d.id) ?? []).some(
          (gl) => gl.genre === activeGenre,
        ),
      )
    : dancers;

  const avatarPaths = filtered
    .map((d) => d.avatar_url)
    .filter((p): p is string => !!p);

  const avatarMap = new Map<string, string>();
  if (avatarPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrls(avatarPaths, 60 * 60);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) {
        avatarMap.set(item.path, item.signedUrl);
      }
    }
  }

  return (
    <main>
      <section
        aria-labelledby="dancers-title"
        className="relative flex min-h-[60svh] flex-col justify-end px-4 pt-32 pb-12 md:px-8 md:pb-20"
      >
        <SectionMarker number="00" label="dancers" />
        <h1
          id="dancers-title"
          className="font-display text-[18vw] leading-[0.85] tracking-tight text-text-1 md:text-[14vw]"
        >
          DANCERS
        </h1>
        <p className="mt-6 max-w-xl font-body text-base text-text-2 md:mt-10 md:text-xl">
          멤버 갤러리. 본인이 채운 프로필이 그대로 모입니다.
        </p>
      </section>

      <section className="border-t border-text-3/30 px-4 py-10 md:px-8 md:py-12">
        <SectionMarker number="01" label="filter" />
        <ul className="-mr-1 -mb-1 flex flex-wrap gap-1">
          <li>
            <Link
              href="/dancers"
              className={`block px-3 py-2 font-body text-xs uppercase tracking-widest ${
                activeGenre === null
                  ? "bg-text-1 text-bg"
                  : "bg-surface text-text-2 hover:text-text-1"
              }`}
            >
              ALL ({dancers.length})
            </Link>
          </li>
          {GENRES.map((genre) => {
            const count = dancers.filter((d) =>
              (genresByMember.get(d.id) ?? []).some(
                (gl) => gl.genre === genre.slug,
              ),
            ).length;
            const active = activeGenre === genre.slug;
            return (
              <li key={genre.slug}>
                <Link
                  href={`/dancers?g=${genre.slug}`}
                  className={`block px-3 py-2 font-body text-xs uppercase tracking-widest ${
                    active
                      ? "bg-text-1 text-bg"
                      : "bg-surface text-text-2 hover:text-text-1"
                  }`}
                >
                  {genre.labelEn} ({count})
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-t border-text-3/30 px-4 py-12 md:px-8 md:py-16">
        {filtered.length === 0 ? (
          <p className="font-body text-base text-text-3">
            {activeGenre
              ? "이 장르에 등록된 댄서가 아직 없습니다."
              : "댄서가 아직 없습니다."}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-px bg-text-3/20 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((d) => {
              const memberGenres = genresByMember.get(d.id) ?? [];
              const primary = memberGenres.find((gl) => gl.is_primary)?.genre;
              const primaryLabel =
                GENRES.find((g) => g.slug === primary)?.labelEn ?? null;
              const signedUrl = d.avatar_url
                ? (avatarMap.get(d.avatar_url) ?? null)
                : null;
              return (
                <li key={d.id} className="bg-bg">
                  <DancerCard
                    name={d.dancer_name}
                    cohort={d.cohort}
                    bio={d.bio}
                    primaryGenre={primaryLabel}
                    avatarUrl={signedUrl}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function DancerCard({
  name,
  cohort,
  bio,
  primaryGenre,
  avatarUrl,
}: {
  name: string;
  cohort: number;
  bio: string | null;
  primaryGenre: string | null;
  avatarUrl: string | null;
}) {
  return (
    <article className="grid gap-3 p-4 md:p-5">
      <div className="aspect-square w-full overflow-hidden bg-surface">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${name} avatar`}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-display text-5xl tracking-tight text-text-3">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="grid gap-1">
        <h3 className="font-display text-2xl leading-none tracking-tight text-text-1">
          {name}
        </h3>
        <div className="flex items-baseline gap-2 font-body text-xs uppercase tracking-widest text-text-3">
          <span>{cohort}기</span>
          {primaryGenre && (
            <>
              <span aria-hidden>·</span>
              <span className="text-text-2">{primaryGenre}</span>
            </>
          )}
        </div>
        {bio && (
          <p className="mt-1 font-body text-sm text-text-2 line-clamp-2">
            {bio}
          </p>
        )}
      </div>
    </article>
  );
}
