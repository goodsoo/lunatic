import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GENRES, type GenreSlug } from "@/lib/genres";
import { createClient } from "@/lib/supabase/server";
import { SectionMarker } from "../../_components/SectionMarker";
import { DancerCard } from "../../_components/DancerCard";

type Params = { slug: GenreSlug };

type DancerRow = {
  id: string;
  dancer_name: string;
  cohort: number;
  avatar_url: string | null;
  bio: string | null;
};

export function generateStaticParams(): Params[] {
  return GENRES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const genre = GENRES.find((g) => g.slug === slug);
  if (!genre) return {};
  return {
    title: `${genre.labelEn} — Real Lunatic`,
    description: `Real Lunatic ${genre.labelKr}(${genre.labelEn}) 허브.`,
  };
}

export default async function GenrePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const genre = GENRES.find((g) => g.slug === slug);
  if (!genre) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dancers: (DancerRow & { isPrimary: boolean; signedUrl: string | null })[] =
    [];
  let memberApproved = false;

  if (user) {
    const { data: meRow } = await supabase
      .from("members")
      .select("application_status")
      .eq("id", user.id)
      .maybeSingle<{ application_status: "pending" | "approved" | "rejected" }>();
    memberApproved = meRow?.application_status === "approved";
  }

  if (memberApproved) {
    const { data: linkRows } = await supabase
      .from("member_genres")
      .select("member_id, is_primary")
      .eq("genre", slug);

    const links = (linkRows ?? []) as {
      member_id: string;
      is_primary: boolean;
    }[];
    const ids = links.map((l) => l.member_id);
    const primaryById = new Map(
      links.map((l) => [l.member_id, l.is_primary]),
    );

    if (ids.length > 0) {
      const { data: rowsRaw } = await supabase
        .from("dancers_member")
        .select("id, dancer_name, cohort, avatar_url, bio")
        .in("id", ids)
        .order("cohort", { ascending: false })
        .order("dancer_name", { ascending: true });

      const rows = (rowsRaw ?? []) as DancerRow[];
      const avatarPaths = rows
        .map((r) => r.avatar_url)
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

      dancers = rows
        .map((r) => ({
          ...r,
          isPrimary: primaryById.get(r.id) ?? false,
          signedUrl: r.avatar_url ? (avatarMap.get(r.avatar_url) ?? null) : null,
        }))
        .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
    }
  }

  return (
    <main>
      <section
        aria-labelledby="genre-title"
        className="relative flex min-h-[70svh] flex-col justify-end px-4 pt-32 pb-16 md:px-8 md:pb-24"
      >
        <SectionMarker number="00" label={genre.slug.replace("_", " ")} />
        <h1
          id="genre-title"
          className="font-display text-[18vw] leading-[0.85] tracking-tight text-text-1 md:text-[14vw]"
        >
          {genre.labelEn}
        </h1>
        <p className="mt-6 max-w-xl font-display text-3xl tracking-tight text-text-2 md:mt-10 md:text-5xl">
          {genre.labelKr}
        </p>
      </section>

      <section className="border-t border-text-3/30 px-4 py-16 md:px-8 md:py-24">
        <SectionMarker number="01" label="dancers" />
        <h2 className="font-display text-5xl leading-none tracking-tight text-text-1 md:text-7xl">
          DANCERS
        </h2>
        {!user ? (
          <p className="mt-8 max-w-xl font-body text-base text-text-2 md:text-lg">
            댄서 갤러리는 멤버 로그인 후 보입니다.
          </p>
        ) : !memberApproved ? (
          <p className="mt-8 max-w-xl font-body text-base text-text-2 md:text-lg">
            가입 승인 후에 댄서 갤러리가 열립니다.
          </p>
        ) : dancers.length === 0 ? (
          <p className="mt-8 max-w-xl font-body text-base text-text-2 md:text-lg">
            아직 이 장르를 등록한 댄서가 없습니다.
          </p>
        ) : (
          <ul className="mt-10 grid grid-cols-2 gap-px bg-text-3/20 md:grid-cols-3 lg:grid-cols-4">
            {dancers.map((d) => (
              <li key={d.id} className="bg-bg">
                <DancerCard
                  href={`/dancers/${d.id}`}
                  name={d.dancer_name}
                  cohort={d.cohort}
                  bio={d.bio}
                  primaryGenre={d.isPrimary ? genre.labelEn : null}
                  avatarUrl={d.signedUrl}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-text-3/30 px-4 py-16 md:px-8 md:py-24">
        <SectionMarker number="02" label="videos" />
        <h2 className="font-display text-5xl leading-none tracking-tight text-text-1 md:text-7xl">
          VIDEOS
        </h2>
        <p className="mt-8 max-w-xl font-body text-base text-text-2 md:text-lg">
          {genre.labelKr} 대표 영상 + 명장면 클립이 올라올 자리입니다. 팀장 시드 대기 중.
        </p>
      </section>

      <section className="border-t border-text-3/30 px-4 py-16 md:px-8 md:py-24">
        <SectionMarker number="03" label="all dancers" />
        <Link
          href="/dancers"
          className="mt-6 inline-block font-display text-2xl tracking-tight text-text-1 underline-offset-8 hover:underline md:text-4xl"
        >
          → 전체 댄서 갤러리
        </Link>
      </section>
    </main>
  );
}
