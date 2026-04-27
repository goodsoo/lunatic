import type { Metadata } from "next";
import { SectionMarker } from "../_components/SectionMarker";

export const metadata: Metadata = {
  title: "Performances — Real Lunatic",
  description: "Real Lunatic 공연 / 배틀 영상 아카이브.",
};

export default function PerformancesPage() {
  return (
    <main>
      <section
        aria-labelledby="performances-title"
        className="relative flex min-h-[70svh] flex-col justify-end px-4 pt-32 pb-16 md:px-8 md:pb-24"
      >
        <SectionMarker number="00" label="performances" />
        <h1
          id="performances-title"
          className="font-display text-[18vw] leading-[0.85] tracking-tight text-text-1 md:text-[14vw]"
        >
          PERFORMANCES
        </h1>
        <p className="mt-6 max-w-xl font-body text-base text-text-2 md:mt-10 md:text-xl">
          공연 / 배틀 영상 아카이브.
          <br />
          시간순, 장르 필터, 검색.
        </p>
      </section>
      <EmptyArchive />
    </main>
  );
}

function EmptyArchive() {
  return (
    <section className="border-t border-text-3/30 px-4 py-24 md:px-8 md:py-32">
      <div className="font-body text-text-3">
        <span className="size-1.5 inline-block bg-accent align-middle" aria-hidden />
        <span className="ml-3 align-middle text-xs uppercase tracking-widest">
          archive opening soon
        </span>
      </div>
      <p className="mt-6 max-w-2xl font-body text-base text-text-2 md:text-lg">
        영상 큐레이션 작업 중입니다. 첫 시드 영상이 올라오면 시간순으로 정렬되고,
        장르별 필터와 통합 검색이 열립니다.
      </p>
    </section>
  );
}
