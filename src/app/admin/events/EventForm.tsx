"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GENRES, type GenreSlug } from "@/lib/genres";
import { EVENT_KINDS, type EventKind } from "@/lib/validation";
import {
  createEvent,
  deleteEvent,
  updateEvent,
  type EventActionState,
} from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  slug_required: "slug을 입력해 주세요.",
  slug_invalid: "slug은 소문자/숫자/하이픈만 사용합니다.",
  slug_too_long: "slug이 너무 깁니다 (80자 이하).",
  slug_taken: "이미 사용 중인 slug입니다.",
  title_required: "제목을 입력해 주세요.",
  title_too_long: "제목이 너무 깁니다.",
  kind_invalid: "행사 종류를 선택해 주세요.",
  starts_at_invalid: "시작 시각이 올바르지 않습니다.",
  ends_at_invalid: "종료 시각이 올바르지 않습니다.",
  ends_before_starts: "종료 시각이 시작 시각보다 빠릅니다.",
  genres_invalid: "유효하지 않은 장르입니다.",
  description_too_long: "설명이 너무 깁니다 (5000자 이하).",
};

export type EventFormInitial = {
  id?: string;
  slug: string;
  title: string;
  kind: EventKind;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  description: string | null;
  is_public: boolean;
  genres: GenreSlug[];
};

const KIND_LABEL: Record<EventKind, string> = {
  performance: "공연",
  battle: "배틀",
  workshop: "워크숍",
  session: "세션",
  other: "기타",
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().slice(0, 16);
}

export function EventForm({ initial }: { initial: EventFormInitial }) {
  const router = useRouter();
  const isEdit = !!initial.id;

  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [slug, setSlug] = useState(initial.slug);
  const [title, setTitle] = useState(initial.title);
  const [kind, setKind] = useState<EventKind>(initial.kind);
  const [startsAt, setStartsAt] = useState(toLocalInput(initial.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalInput(initial.ends_at));
  const [location, setLocation] = useState(initial.location ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [isPublic, setIsPublic] = useState(initial.is_public);
  const [genres, setGenres] = useState<GenreSlug[]>(initial.genres);

  function toggleGenre(slug: GenreSlug) {
    setGenres((prev) =>
      prev.includes(slug) ? prev.filter((g) => g !== slug) : [...prev, slug],
    );
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setSavedAt(null);

    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const action: (
        prev: EventActionState | undefined,
        fd: FormData,
      ) => Promise<EventActionState> = isEdit
        ? (prev, f) => updateEvent(initial.id!, prev, f)
        : createEvent;
      const result = await action(undefined, fd);
      if (result?.error) setError(result.error);
      else if (result?.ok) setSavedAt(Date.now());
    });
  }

  function handleDelete() {
    if (!initial.id) return;
    if (!confirm(`"${initial.title}" 행사를 삭제할까요?`)) return;
    startDelete(async () => {
      const result = await deleteEvent(initial.id!);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 md:max-w-3xl">
      <Field label="slug *" htmlFor="slug" hint="URL에 쓰이는 식별자. 소문자/숫자/하이픈.">
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
      </Field>

      <Field label="제목 *" htmlFor="title">
        <Input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>

      <Field label="종류 *">
        <div className="grid gap-px bg-text-3/30 md:grid-cols-5">
          {EVENT_KINDS.map((k) => (
            <label
              key={k}
              className="flex cursor-pointer items-center gap-3 bg-bg px-4 py-4"
            >
              <input
                type="radio"
                name="kind"
                value={k}
                checked={kind === k}
                onChange={() => setKind(k)}
                className="size-4 accent-accent"
              />
              <span className="font-body text-base text-text-1">
                {KIND_LABEL[k]}
              </span>
            </label>
          ))}
        </div>
      </Field>

      <div className="grid gap-10 md:grid-cols-2">
        <Field label="시작 *" htmlFor="starts_at">
          <Input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </Field>
        <Field label="종료" htmlFor="ends_at" hint="비우면 단일 시각.">
          <Input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </Field>
      </div>

      <Field label="장소" htmlFor="location">
        <Input
          id="location"
          name="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </Field>

      <Field label="설명" htmlFor="description" hint="markdown 가능. 5000자 이하.">
        <textarea
          id="description"
          name="description"
          rows={6}
          maxLength={5000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-surface px-4 py-3 font-body text-base text-text-1 outline-none focus:bg-[#111]"
        />
      </Field>

      <Field label="장르" hint="복수 선택 가능.">
        <ul className="grid gap-px bg-text-3/30 md:grid-cols-3">
          {GENRES.map((g) => {
            const selected = genres.includes(g.slug);
            return (
              <li key={g.slug} className="bg-bg">
                <label className="flex cursor-pointer items-center gap-3 px-4 py-4">
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
                  <span className="font-body text-xs text-text-3">
                    {g.labelKr}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </Field>

      <Field label="공개">
        <div className="grid gap-px bg-text-3/30 md:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 bg-bg px-4 py-4">
            <input
              type="radio"
              name="is_public"
              value="yes"
              checked={isPublic}
              onChange={() => setIsPublic(true)}
              className="size-4 accent-accent"
            />
            <span className="font-body text-base text-text-1">
              공개 (외부에서 보임)
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 bg-bg px-4 py-4">
            <input
              type="radio"
              name="is_public"
              value="no"
              checked={!isPublic}
              onChange={() => setIsPublic(false)}
              className="size-4 accent-accent"
            />
            <span className="font-body text-base text-text-1">
              멤버 전용
            </span>
          </label>
        </div>
      </Field>

      {error && (
        <div
          role="alert"
          className="bg-surface px-4 py-3 font-body text-sm text-accent"
        >
          {ERROR_MESSAGES[error] ?? `오류: ${error}`}
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer bg-text-1 px-6 py-4 font-display text-2xl uppercase tracking-tight text-bg transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Create event"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/events")}
          className="cursor-pointer bg-surface px-6 py-4 font-body text-base uppercase tracking-widest text-text-2 hover:text-text-1"
        >
          Cancel
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="ml-auto cursor-pointer bg-surface px-6 py-4 font-body text-base uppercase tracking-widest text-accent hover:opacity-80 disabled:opacity-40"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
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
