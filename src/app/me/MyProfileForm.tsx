"use client";

import { useState, useTransition, type FormEvent } from "react";
import { GENRES, type GenreSlug } from "@/lib/genres";
import { updateMyProfile } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  dancer_name_required: "댄서명을 입력해 주세요.",
  dancer_name_taken: "이미 사용 중인 댄서명입니다.",
  type_invalid: "타입을 선택해 주세요.",
  genres_required: "장르를 1개 이상 선택해 주세요.",
  genres_invalid: "유효하지 않은 장르입니다.",
  primary_genre_invalid: "선택한 장르 중에서 primary를 골라 주세요.",
  bio_long_too_long: "자기소개는 200자 이하로 작성해 주세요.",
  too_many_videos: "영상은 최대 3개까지 등록할 수 있습니다.",
};

function errorText(code?: string) {
  if (!code) return null;
  return ERROR_MESSAGES[code] ?? `오류: ${code}`;
}

export type MemberProfile = {
  dancer_name: string;
  type: "undergrad" | "grad" | "other";
  instagram_handle: string | null;
  bio: string | null;
  bio_long: string | null;
  video_urls: string[];
};

export function MyProfileForm({
  initial,
  initialGenres,
  initialPrimary,
}: {
  initial: MemberProfile;
  initialGenres: GenreSlug[];
  initialPrimary: GenreSlug | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [dancerName, setDancerName] = useState(initial.dancer_name);
  const [type, setType] = useState<MemberProfile["type"]>(initial.type);
  const [genres, setGenres] = useState<GenreSlug[]>(initialGenres);
  const [primary, setPrimary] = useState<GenreSlug | "">(initialPrimary ?? "");
  const [instagram, setInstagram] = useState(initial.instagram_handle ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [bioLong, setBioLong] = useState(initial.bio_long ?? "");
  const [video1, setVideo1] = useState(initial.video_urls[0] ?? "");
  const [video2, setVideo2] = useState(initial.video_urls[1] ?? "");
  const [video3, setVideo3] = useState(initial.video_urls[2] ?? "");

  function toggleGenre(slug: GenreSlug) {
    setGenres((prev) =>
      prev.includes(slug) ? prev.filter((g) => g !== slug) : [...prev, slug],
    );
    if (primary === slug && genres.includes(slug)) {
      setPrimary("");
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setSavedAt(null);

    if (!dancerName.trim()) return setError("dancer_name_required");
    if (genres.length === 0) return setError("genres_required");
    if (!primary || !genres.includes(primary)) {
      return setError("primary_genre_invalid");
    }
    if (bioLong.length > 200) return setError("bio_long_too_long");

    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateMyProfile(undefined, fd);
      if (result.error) setError(result.error);
      else if (result.ok) setSavedAt(Date.now());
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-12">
      <Field label="댄서명 *" htmlFor="dancer_name" hint="갤러리에 표시되는 이름.">
        <Input
          id="dancer_name"
          name="dancer_name"
          required
          value={dancerName}
          onChange={(e) => setDancerName(e.target.value)}
        />
      </Field>

      <Field label="타입 *">
        <div className="grid gap-px bg-text-3/30 md:grid-cols-3">
          {[
            { value: "undergrad", label: "학부" },
            { value: "grad", label: "대학원" },
            { value: "other", label: "기타" },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-3 bg-bg px-4 py-4"
            >
              <input
                type="radio"
                name="type"
                value={opt.value}
                checked={type === opt.value}
                onChange={() => setType(opt.value as MemberProfile["type"])}
                className="size-4 accent-accent"
              />
              <span className="font-body text-base text-text-1">{opt.label}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field
        label="장르 * (≥1)"
        hint="복수 선택 가능. 그중 primary 1개 표시."
      >
        <ul className="grid gap-px bg-text-3/30 md:grid-cols-3">
          {GENRES.map((g) => {
            const selected = genres.includes(g.slug);
            const isPrimary = primary === g.slug;
            return (
              <li key={g.slug} className="bg-bg">
                <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-4">
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="genres"
                      value={g.slug}
                      checked={selected}
                      onChange={() => toggleGenre(g.slug)}
                      className="size-4 accent-accent"
                    />
                    <span className="font-display text-lg tracking-tight text-text-1">
                      {g.labelEn}
                    </span>
                    <span className="font-body text-xs text-text-3">{g.labelKr}</span>
                  </span>
                  <label
                    className={`flex cursor-pointer items-center gap-2 text-xs uppercase tracking-widest ${
                      selected ? "text-text-2" : "text-text-3/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="primary_genre"
                      value={g.slug}
                      checked={isPrimary}
                      disabled={!selected}
                      onChange={() => setPrimary(g.slug)}
                      className="size-3 accent-accent"
                    />
                    primary
                  </label>
                </label>
              </li>
            );
          })}
        </ul>
      </Field>

      <Field label="인스타그램" htmlFor="instagram_handle" hint="@ 없이.">
        <Input
          id="instagram_handle"
          name="instagram_handle"
          placeholder="lunatic_street"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
        />
      </Field>

      <Field label="한 줄 자기소개" htmlFor="bio">
        <Input
          id="bio"
          name="bio"
          maxLength={120}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </Field>

      <Field label="자유 자기소개" htmlFor="bio_long" hint="200자 이하.">
        <textarea
          id="bio_long"
          name="bio_long"
          maxLength={200}
          rows={4}
          value={bioLong}
          onChange={(e) => setBioLong(e.target.value)}
          className="w-full bg-surface px-4 py-3 font-body text-base text-text-1 outline-none focus:bg-[#111]"
        />
      </Field>

      <Field label="영상 (최대 3개, 유튜브 URL)" hint="비워도 됨.">
        <div className="grid gap-3">
          <Input
            name="video_url_1"
            placeholder="https://youtube.com/watch?v=..."
            value={video1}
            onChange={(e) => setVideo1(e.target.value)}
          />
          <Input
            name="video_url_2"
            placeholder="https://youtube.com/watch?v=..."
            value={video2}
            onChange={(e) => setVideo2(e.target.value)}
          />
          <Input
            name="video_url_3"
            placeholder="https://youtube.com/watch?v=..."
            value={video3}
            onChange={(e) => setVideo3(e.target.value)}
          />
        </div>
      </Field>

      {error && (
        <div
          role="alert"
          className="bg-surface px-4 py-3 font-body text-sm text-accent"
        >
          {errorText(error)}
        </div>
      )}
      {savedAt && !error && (
        <div
          role="status"
          className="bg-surface px-4 py-3 font-body text-sm text-text-1"
        >
          저장됐습니다.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer bg-text-1 px-6 py-4 font-display text-2xl uppercase tracking-tight text-bg transition-opacity hover:opacity-80 disabled:opacity-40 md:text-3xl"
      >
        {isPending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3">
      <label
        htmlFor={htmlFor}
        className="font-body text-xs uppercase tracking-widest text-text-2"
      >
        {label}
      </label>
      {children}
      {hint && <p className="font-body text-xs text-text-3">{hint}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-surface px-4 py-3 font-body text-base text-text-1 outline-none focus:bg-[#111]"
    />
  );
}
