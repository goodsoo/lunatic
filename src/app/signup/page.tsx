import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserAndMember } from "@/lib/auth";
import { SectionMarker } from "../_components/SectionMarker";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Sign up — Real Lunatic",
  description: "Real Lunatic 가입 신청.",
};

export default async function SignupPage() {
  const { user, member } = await getUserAndMember();

  if (!user) redirect("/auth/error?reason=login_required");
  if (member) redirect("/");

  return (
    <main>
      <section
        aria-labelledby="signup-title"
        className="relative px-4 pt-32 pb-16 md:px-8 md:pb-24"
      >
        <SectionMarker number="00" label="signup" />
        <h1
          id="signup-title"
          className="font-display text-[18vw] leading-[0.85] tracking-tight text-text-1 md:text-[12vw]"
        >
          SIGN UP
        </h1>
        <p className="mt-6 max-w-xl font-body text-base text-text-2 md:mt-10 md:text-xl">
          Real Lunatic 가입 신청.
          <br />
          invite code가 있으면 즉시 승인, 없으면 운영진 검토 후 승인.
        </p>
      </section>

      <section className="relative border-t border-text-3/30 px-4 py-16 md:px-8 md:py-24">
        <div className="md:max-w-3xl">
          <SignupForm email={user.email ?? ""} />
        </div>
      </section>
    </main>
  );
}
