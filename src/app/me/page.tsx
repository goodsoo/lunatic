import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type GenreSlug } from "@/lib/genres";
import { SectionMarker } from "../_components/SectionMarker";
import { MyProfileForm, type MemberProfile } from "./MyProfileForm";
import { AvatarUploader } from "./AvatarUploader";

export const metadata: Metadata = {
  title: "My profile — Real Lunatic",
  description: "댄서 프로필 편집.",
};

type MemberRow = MemberProfile & {
  real_name: string;
  email: string;
  cohort: number;
  school: string;
  student_id: string | null;
  country: string;
  role: "owner" | "admin" | "member";
  application_status: "pending" | "approved" | "rejected";
  avatar_url: string | null;
};

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/error?reason=login_required");

  const { data: member } = await supabase
    .from("members")
    .select(
      "dancer_name, type, instagram_handle, bio, bio_long, video_urls, real_name, email, cohort, school, student_id, country, role, application_status, avatar_url",
    )
    .eq("id", user.id)
    .maybeSingle<MemberRow>();

  if (!member) redirect("/signup");

  const { data: genreRows } = await supabase
    .from("member_genres")
    .select("genre, is_primary")
    .eq("member_id", user.id);

  const genres = (genreRows ?? []).map((r) => r.genre as GenreSlug);
  const primary =
    (genreRows ?? []).find((r) => r.is_primary)?.genre as GenreSlug | undefined;

  let avatarSignedUrl: string | null = null;
  if (member.avatar_url) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(member.avatar_url, 60 * 60);
    avatarSignedUrl = signed?.signedUrl ?? null;
  }

  return (
    <main>
      <section
        aria-labelledby="me-title"
        className="relative px-4 pt-32 pb-16 md:px-8 md:pb-24"
      >
        <SectionMarker number="00" label="my profile" />
        <h1
          id="me-title"
          className="font-display text-[18vw] leading-[0.85] tracking-tight text-text-1 md:text-[12vw]"
        >
          MY PROFILE
        </h1>
      </section>

      <section className="relative border-t border-text-3/30 px-4 py-16 md:px-8 md:py-20">
        <SectionMarker number="01" label="account" />
        <h2 className="font-display text-3xl tracking-tight text-text-1 md:text-5xl">
          ACCOUNT
        </h2>
        <dl className="mt-10 grid gap-px bg-text-3/30 md:grid-cols-2">
          <Row label="이메일" value={member.email} />
          <Row label="실명" value={member.real_name} />
          <Row label="기수" value={String(member.cohort)} />
          <Row label="학교" value={member.school} />
          <Row label="학번" value={member.student_id ?? "—"} />
          <Row label="국가" value={member.country} />
          <Row label="역할" value={member.role} />
          <Row label="가입 상태" value={member.application_status} />
        </dl>
        <p className="mt-6 font-body text-xs text-text-3">
          이메일/실명/기수/학교/학번/국가는 운영진 문의로 변경합니다.
        </p>
      </section>

      <section className="relative border-t border-text-3/30 px-4 py-16 md:px-8 md:py-24">
        <SectionMarker number="02" label="profile" />
        <h2 className="font-display text-3xl tracking-tight text-text-1 md:text-5xl">
          PROFILE
        </h2>
        <div className="mt-10 grid gap-12 md:max-w-3xl">
          <AvatarUploader
            userId={user.id}
            initialUrl={avatarSignedUrl}
            hasAvatar={!!member.avatar_url}
          />
          <MyProfileForm
            initial={{
              dancer_name: member.dancer_name,
              type: member.type,
              instagram_handle: member.instagram_handle,
              bio: member.bio,
              bio_long: member.bio_long,
              video_urls: member.video_urls ?? [],
            }}
            initialGenres={genres}
            initialPrimary={primary ?? null}
          />
        </div>
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 bg-bg px-4 py-4">
      <dt className="font-body text-xs uppercase tracking-widest text-text-3">
        {label}
      </dt>
      <dd className="font-body text-base text-text-1">{value}</dd>
    </div>
  );
}
