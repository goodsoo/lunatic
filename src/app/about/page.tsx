import type { Metadata } from "next";
import Link from "next/link";
import { SectionMarker } from "../_components/SectionMarker";

export const metadata: Metadata = {
  title: "About — Real Lunatic",
  description: "KAIST 스트릿 댄스 동아리 Real Lunatic 소개 + 가입 안내.",
};

export default function AboutPage() {
  return (
    <main>
      <AboutHero />
      <WhoWeAre />
      <Join />
      <Contact />
    </main>
  );
}

function AboutHero() {
  return (
    <section
      aria-labelledby="about-title"
      className="relative flex min-h-[70svh] flex-col justify-end px-4 pt-32 pb-16 md:px-8 md:pb-24"
    >
      <SectionMarker number="00" label="about" />
      <h1
        id="about-title"
        className="font-display text-[18vw] leading-[0.85] tracking-tight text-text-1 md:text-[14vw]"
      >
        ABOUT
      </h1>
      <p className="mt-6 max-w-xl font-body text-base text-text-2 md:mt-10 md:text-xl">
        9 genres. one crew. since 2004.
        <br />
        카이스트의 스트릿 댄스 동아리.
      </p>
    </section>
  );
}

function WhoWeAre() {
  return (
    <section
      aria-labelledby="who-title"
      className="relative border-t border-text-3/30 px-4 py-24 md:px-8 md:py-32"
    >
      <SectionMarker number="01" label="who we are" />
      <h2
        id="who-title"
        className="font-display text-5xl leading-none tracking-tight text-text-1 md:text-7xl"
      >
        WHO WE ARE
      </h2>
      <div className="mt-10 grid gap-8 font-body text-base text-text-2 md:mt-16 md:max-w-3xl md:text-lg">
        <p>
          Real Lunatic은 카이스트(KAIST) 학내 스트릿 댄스 동아리입니다. 2004년
          시작해서 지금까지 활동 중이며, 9개 장르로 나뉘어 활동합니다.
        </p>
        <p>
          학기마다 정기 공연을 열고, 외부 행사와 배틀에도 출전합니다. 신입은
          댄스 경험과 무관하게 열려 있습니다 — 진심으로 오래 출 사람을 찾습니다.
        </p>
      </div>
    </section>
  );
}

function Join() {
  return (
    <section
      aria-labelledby="join-title"
      className="relative border-t border-text-3/30 px-4 py-24 md:px-8 md:py-32"
    >
      <SectionMarker number="02" label="join" />
      <h2
        id="join-title"
        className="font-display text-5xl leading-none tracking-tight text-text-1 md:text-7xl"
      >
        JOIN US
      </h2>
      <div className="mt-10 grid gap-8 font-body text-base text-text-2 md:mt-16 md:max-w-3xl md:text-lg">
        <p>
          매년 봄·가을 신입을 모집합니다. 모집 일정은 공식 인스타그램에 올라옵니다.
        </p>
        <p>
          현역/졸업생 추천이 있으면 invite code를 받을 수 있습니다. 코드가 있으면
          가입이 즉시 승인됩니다. 코드가 없어도 가입 신청은 가능 — 운영진이 검토 후
          승인합니다.
        </p>
        <p className="text-text-3">
          ※ 가입 폼은 곧 열립니다. 지금은 인스타 DM으로 문의 주세요.
        </p>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section
      aria-labelledby="contact-title"
      className="relative border-t border-text-3/30 px-4 py-24 md:px-8 md:py-32"
    >
      <SectionMarker number="03" label="contact" />
      <h2
        id="contact-title"
        className="font-display text-5xl leading-none tracking-tight text-text-1 md:text-7xl"
      >
        CONTACT
      </h2>
      <ul className="mt-10 grid gap-px bg-text-3/30 md:mt-16 md:grid-cols-2">
        <ContactRow
          label="Instagram"
          value="@lunatic_street"
          href="https://instagram.com/lunatic_street"
        />
        <ContactRow label="Location" value="KAIST · Daejeon" />
      </ul>
    </section>
  );
}

function ContactRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex flex-col gap-3 bg-bg p-6 md:p-8">
      <span className="size-1.5 bg-accent" aria-hidden />
      <span className="font-body text-xs uppercase tracking-widest text-text-3">
        {label}
      </span>
      <span className="font-display text-2xl tracking-tight text-text-1 md:text-3xl">
        {value}
      </span>
    </div>
  );
  return (
    <li>
      {href ? (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-opacity hover:opacity-70"
        >
          {inner}
        </Link>
      ) : (
        inner
      )}
    </li>
  );
}
