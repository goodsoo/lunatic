import Link from "next/link";
import { GENRES } from "@/lib/genres";
import { SectionMarker } from "./_components/SectionMarker";

export default function Home() {
  return (
    <main>
      <Hero />
      <GenresSection />
    </main>
  );
}

function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-svh flex-col justify-end px-4 pt-32 pb-16 md:px-8 md:pb-24"
    >
      <SectionMarker number="00" label="hero" />
      <h1
        id="hero-title"
        className="font-display text-[20vw] leading-[0.85] tracking-tight text-text-1 md:text-[16vw]"
      >
        LUNATIC
      </h1>
      <p className="mt-6 max-w-xl font-body text-base text-text-2 md:mt-10 md:text-xl">
        9 genres, one crew.
        <br />
        KAIST 스트릿 댄스 동아리.
      </p>
    </section>
  );
}

function GenresSection() {
  return (
    <section
      aria-labelledby="genres-title"
      className="relative border-t border-text-3/30 px-4 py-24 md:px-8 md:py-32"
    >
      <SectionMarker number="02" label="genres" />
      <h2
        id="genres-title"
        className="font-display text-6xl leading-none tracking-tight text-text-1 md:text-8xl"
      >
        9 GENRES
      </h2>
      <ul className="mt-12 grid grid-cols-1 gap-px bg-text-3/30 md:mt-20 md:grid-cols-3">
        {GENRES.map((genre) => (
          <li key={genre.slug}>
            <Link
              href={`/genres/${genre.slug}`}
              className="group flex aspect-[4/3] flex-col justify-between bg-bg p-6 transition-opacity hover:opacity-70 md:p-8"
            >
              <span className="size-1.5 bg-accent" aria-hidden />
              <div>
                <div className="font-display text-3xl leading-none tracking-tight text-text-1 md:text-5xl">
                  {genre.labelEn}
                </div>
                <div className="mt-2 font-body text-sm text-text-2 md:text-base">
                  {genre.labelKr}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
