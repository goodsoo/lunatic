import type { Metadata } from "next";
import Link from "next/link";
import { SectionMarker } from "../../_components/SectionMarker";

export const metadata: Metadata = {
  title: "Pending — Real Lunatic",
  description: "가입 신청 접수됨. 운영진 검토 대기.",
};

export default function SignupPendingPage() {
  return (
    <main>
      <section
        aria-labelledby="pending-title"
        className="relative flex min-h-[70svh] flex-col justify-end px-4 pt-32 pb-16 md:px-8 md:pb-24"
      >
        <SectionMarker number="00" label="pending" />
        <h1
          id="pending-title"
          className="font-display text-[16vw] leading-[0.85] tracking-tight text-text-1 md:text-[12vw]"
        >
          PENDING
        </h1>
        <p className="mt-6 max-w-xl font-body text-base text-text-2 md:mt-10 md:text-xl">
          신청이 접수됐습니다.
          <br />
          운영진이 검토 후 승인합니다. 승인되면 멤버 페이지가 열립니다.
        </p>
        <div className="mt-12">
          <Link
            href="/"
            className="inline-block bg-text-1 px-6 py-3 font-display text-xl uppercase tracking-tight text-bg transition-opacity hover:opacity-80"
          >
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
