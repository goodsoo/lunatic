import type { Metadata } from "next";
import { SectionMarker } from "../_components/SectionMarker";

export const metadata: Metadata = {
  title: "Store — Real Lunatic",
  description: "Real Lunatic 굿즈 카탈로그.",
};

export default function StorePage() {
  return (
    <main>
      <section
        aria-labelledby="store-title"
        className="relative flex min-h-[70svh] flex-col justify-end px-4 pt-32 pb-16 md:px-8 md:pb-24"
      >
        <SectionMarker number="00" label="store" />
        <h1
          id="store-title"
          className="font-display text-[18vw] leading-[0.85] tracking-tight text-text-1 md:text-[14vw]"
        >
          STORE
        </h1>
        <p className="mt-6 max-w-xl font-body text-base text-text-2 md:mt-10 md:text-xl">
          굿즈 카탈로그.
          <br />
          공연 시즌 한정 드롭.
        </p>
      </section>
      <EmptyStore />
    </main>
  );
}

function EmptyStore() {
  return (
    <section className="border-t border-text-3/30 px-4 py-24 md:px-8 md:py-32">
      <div className="font-body text-text-3">
        <span className="size-1.5 inline-block bg-accent align-middle" aria-hidden />
        <span className="ml-3 align-middle text-xs uppercase tracking-widest">
          drops coming soon
        </span>
      </div>
      <p className="mt-6 max-w-2xl font-body text-base text-text-2 md:text-lg">
        굿즈 라인은 공연 시즌에 맞춰 한정 수량으로 풀립니다. 드롭 알림은 인스타에
        먼저 올라옵니다.
      </p>
    </section>
  );
}
