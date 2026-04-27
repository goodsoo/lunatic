import type { Metadata } from "next";
import Link from "next/link";
import { SectionMarker } from "../../_components/SectionMarker";

export const metadata: Metadata = {
  title: "Sign-in error — Real Lunatic",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  return (
    <main className="px-4 pt-32 pb-24 md:px-8">
      <SectionMarker number="ee" label="auth error" />
      <h1 className="font-display text-5xl leading-none tracking-tight text-text-1 md:text-7xl">
        SIGN-IN FAILED
      </h1>
      <p className="mt-6 max-w-2xl font-body text-base text-text-2 md:text-lg">
        로그인 도중 문제가 생겼습니다.
        {reason ? (
          <>
            <br />
            <span className="text-text-3">사유: {reason}</span>
          </>
        ) : null}
      </p>
      <Link
        href="/"
        className="mt-10 inline-block font-body text-sm uppercase tracking-widest text-accent hover:opacity-70"
      >
        ← Back to home
      </Link>
    </main>
  );
}
