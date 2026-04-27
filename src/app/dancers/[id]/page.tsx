import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GENRES, type GenreSlug } from "@/lib/genres";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { SectionMarker } from "../../_components/SectionMarker";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DancerRow = {
  id: string;
  dancer_name: string;
  cohort: number;
  avatar_url: string | null;
  instagram_handle: string | null;
  bio: string | null;
  bio_long: string | null;
  video_urls: string[] | null;
  type: "undergrad" | "grad" | "other";
  school: string | null;
};

type GenreLink = { genre: GenreSlug; is_primary: boolean };

const TYPE_LABEL: Record<DancerRow["type"], string> = {
  undergrad: "학부",
  grad: "대학원",
  other: "기타",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("dancers_member")
    .select("dancer_name, bio")
    .eq("id", id)
    .maybeSingle<{ dancer_name: string; bio: string | null }>();
  if (!data) return {};
  return {
    title: `${data.dancer_name} — Real Lunatic`,
    description: data.bio ?? `Real Lunatic 댄서 ${data.dancer_name}.`,
  };
}

export default async function DancerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

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

  const { data: dancer } = await supabase
    .from("dancers_member")
    .select(
      "id, dancer_name, cohort, avatar_url, instagram_handle, bio, bio_long, video_urls, type, school",
    )
    .eq("id", id)
    .maybeSingle<DancerRow>();

  if (!dancer) notFound();

  const { data: genreRowsRaw } = await supabase
    .from("member_genres")
    .select("genre, is_primary")
    .eq("member_id", id);

  const genreRows = (genreRowsRaw ?? []) as GenreLink[];
  const primarySlug = genreRows.find((r) => r.is_primary)?.genre;
  const otherSlugs = genreRows
    .filter((r) => !r.is_primary)
    .map((r) => r.genre);

  let avatarSignedUrl: string | null = null;
  if (dancer.avatar_url) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(dancer.avatar_url, 60 * 60);
    avatarSignedUrl = signed?.signedUrl ?? null;
  }

  const videos = (dancer.video_urls ?? [])
    .map((url) => ({ url, embed: youtubeEmbedUrl(url) }))
    .filter((v) => v.embed !== null) as { url: string; embed: string }[];

  const primaryLabel =
    GENRES.find((g) => g.slug === primarySlug)?.labelEn ?? null;

  return (
    <main>
      <section
        aria-labelledby="dancer-title"
        className="relative px-4 pt-32 pb-12 md:px-8 md:pb-16"
      >
        <SectionMarker number="00" label="dancer" />
        <Link
          href="/dancers"
          className="mb-6 inline-block font-body text-xs uppercase tracking-widest text-text-3 hover:text-text-1"
        >
          ← Dancers
        </Link>
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_2fr] md:gap-16">
          <div className="aspect-square w-full overflow-hidden bg-surface md:max-w-md">
            {avatarSignedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSignedUrl}
                alt={`${dancer.dancer_name} avatar`}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center font-display text-[20vw] tracking-tight text-text-3 md:text-[8vw]">
                {dancer.dancer_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="grid content-start gap-6">
            <h1
              id="dancer-title"
              className="font-display text-[14vw] leading-[0.85] tracking-tight text-text-1 md:text-[8vw]"
            >
              {dancer.dancer_name}
            </h1>
            <dl className="grid gap-px bg-text-3/30 md:grid-cols-2">
              <Meta label="기수" value={`${dancer.cohort}기`} />
              <Meta label="타입" value={TYPE_LABEL[dancer.type]} />
              {primaryLabel && (
                <Meta label="primary" value={primaryLabel} />
              )}
              {otherSlugs.length > 0 && (
                <Meta
                  label="장르"
                  value={otherSlugs
                    .map(
                      (s) => GENRES.find((g) => g.slug === s)?.labelEn ?? s,
                    )
                    .join(" / ")}
                />
              )}
              {dancer.school && (
                <Meta label="학교" value={dancer.school} />
              )}
              {dancer.instagram_handle && (
                <Meta
                  label="instagram"
                  value={
                    <a
                      href={`https://instagram.com/${dancer.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-1 underline-offset-4 hover:underline"
                    >
                      @{dancer.instagram_handle}
                    </a>
                  }
                />
              )}
            </dl>
            {dancer.bio && (
              <p className="font-display text-2xl leading-tight tracking-tight text-text-1 md:text-3xl">
                {dancer.bio}
              </p>
            )}
            {dancer.bio_long && (
              <p className="max-w-2xl font-body text-base leading-relaxed text-text-2 md:text-lg">
                {dancer.bio_long}
              </p>
            )}
          </div>
        </div>
      </section>

      {videos.length > 0 && (
        <section className="border-t border-text-3/30 px-4 py-16 md:px-8 md:py-24">
          <SectionMarker number="01" label="videos" />
          <h2 className="font-display text-3xl tracking-tight text-text-1 md:text-5xl">
            VIDEOS
          </h2>
          <ul className="mt-10 grid gap-8 md:gap-12">
            {videos.map((v, i) => (
              <li key={v.url} className="grid gap-3">
                <div className="aspect-video w-full overflow-hidden bg-surface">
                  <iframe
                    src={v.embed}
                    title={`${dancer.dancer_name} video ${i + 1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="size-full"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function Meta({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 bg-bg px-4 py-3">
      <dt className="font-body text-xs uppercase tracking-widest text-text-3">
        {label}
      </dt>
      <dd className="font-body text-base text-text-1">{value}</dd>
    </div>
  );
}
