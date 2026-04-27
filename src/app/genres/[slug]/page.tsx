import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GENRES, type GenreSlug } from "@/lib/genres";
import { SectionMarker } from "../../_components/SectionMarker";

type Params = { slug: GenreSlug };

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

      <section className="border-t border-text-3/30 px-4 py-24 md:px-8 md:py-32">
        <SectionMarker number="01" label="dancers" />
        <h2 className="font-display text-5xl leading-none tracking-tight text-text-1 md:text-7xl">
          DANCERS
        </h2>
        <p className="mt-8 max-w-xl font-body text-base text-text-2 md:text-lg">
          댄서 페이지가 곧 모입니다. 멤버 본인이 자기 페이지를 채우면
          여기에 그리드로 표시됩니다.
        </p>
      </section>

      <section className="border-t border-text-3/30 px-4 py-24 md:px-8 md:py-32">
        <SectionMarker number="02" label="videos" />
        <h2 className="font-display text-5xl leading-none tracking-tight text-text-1 md:text-7xl">
          VIDEOS
        </h2>
        <p className="mt-8 max-w-xl font-body text-base text-text-2 md:text-lg">
          {genre.labelKr} 대표 영상 + 명장면 클립이 올라올 자리입니다.
        </p>
      </section>
    </main>
  );
}
