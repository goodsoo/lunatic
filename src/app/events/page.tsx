import type { Metadata } from "next";
import { SectionMarker } from "../_components/SectionMarker";

export const metadata: Metadata = {
  title: "Events — Real Lunatic",
  description: "Real Lunatic 행사 연혁 + 다가오는 행사.",
};

export default function EventsPage() {
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
      <EmptyEvents />
    </main>
  );
}

function EmptyEvents() {
  return (
    <section className="border-t border-text-3/30 px-4 py-24 md:px-8 md:py-32">
      <div className="font-body text-text-3">
        <span className="size-1.5 inline-block bg-accent align-middle" aria-hidden />
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
