"use client";

import { useActionState, useState } from "react";
import { submitSignup, type SignupState } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  real_name_required: "실명을 입력해 주세요.",
  cohort_invalid: "기수는 0.5 단위 양수로 입력해 주세요. (예: 11, 11.5, 12)",
  country_required: "국가를 선택해 주세요.",
  school_required: "학교를 입력해 주세요.",
  student_id_required: "학번을 입력해 주세요.",
  invite_code_required: "invite code를 입력하거나 '코드 없음'을 선택해 주세요.",
  invite_code_invalid: "invite code가 유효하지 않거나 만료됐습니다.",
  already_signed_up: "이미 가입 신청한 계정입니다.",
};

const COUNTRIES: { value: string; label: string }[] = [
  { value: "KR", label: "대한민국" },
  { value: "JP", label: "일본" },
  { value: "CN", label: "중국" },
  { value: "TW", label: "대만" },
  { value: "HK", label: "홍콩" },
  { value: "VN", label: "베트남" },
  { value: "US", label: "미국" },
  { value: "OTHER", label: "그 외" },
];

function errorText(code?: string) {
  if (!code) return null;
  return ERROR_MESSAGES[code] ?? `오류: ${code}`;
}

export function SignupForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<SignupState | undefined, FormData>(
    submitSignup,
    undefined,
  );

  // Controlled state — React 19 resets the form after action runs, so we hold
  // values in state to survive the reset.
  const [hasCode, setHasCode] = useState<"yes" | "no">("no");
  const [inviteCode, setInviteCode] = useState("");
  const [realName, setRealName] = useState("");
  const [cohort, setCohort] = useState("");
  const [country, setCountry] = useState("KR");
  const [school, setSchool] = useState("KAIST");
  const [studentId, setStudentId] = useState("");

  return (
    <form action={formAction} className="grid gap-12">
      <Field label="이메일">
        <div className="bg-surface px-4 py-3 font-body text-base text-text-2">
          {email}
        </div>
      </Field>

      <fieldset className="grid gap-3">
        <legend className="font-body text-xs uppercase tracking-widest text-text-2">
          invite code 있어요?
        </legend>
        <div className="grid gap-px bg-text-3/30 md:grid-cols-2">
          <RadioCard
            name="has_code"
            value="yes"
            label="네, 코드 있어요"
            sub="입력 시 즉시 승인됩니다."
            checked={hasCode === "yes"}
            onChange={() => setHasCode("yes")}
          />
          <RadioCard
            name="has_code"
            value="no"
            label="아니요, 신청만"
            sub="운영진이 검토 후 승인합니다."
            checked={hasCode === "no"}
            onChange={() => setHasCode("no")}
          />
        </div>
        {hasCode === "yes" && (
          <input
            name="invite_code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="invite code"
            autoCapitalize="characters"
            className="mt-3 w-full bg-surface px-4 py-3 font-body text-base tracking-widest text-text-1 outline-none focus:bg-[#111]"
          />
        )}
      </fieldset>

      <Field label="실명 *" htmlFor="real_name">
        <Input
          id="real_name"
          name="real_name"
          required
          autoComplete="name"
          value={realName}
          onChange={(e) => setRealName(e.target.value)}
        />
      </Field>

      <Field label="기수 *" htmlFor="cohort" hint="0.5 단위. (예: 11, 11.5, 12)">
        <Input
          id="cohort"
          name="cohort"
          type="number"
          step="0.5"
          min="0.5"
          required
          inputMode="decimal"
          value={cohort}
          onChange={(e) => setCohort(e.target.value)}
        />
      </Field>

      <Field label="국가 *" htmlFor="country">
        <select
          id="country"
          name="country"
          required
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full bg-surface px-4 py-3 font-body text-base text-text-1 outline-none focus:bg-[#111]"
        >
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value} className="bg-bg">
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="학교 *" htmlFor="school" hint="기본 KAIST.">
        <Input
          id="school"
          name="school"
          required
          value={school}
          onChange={(e) => setSchool(e.target.value)}
        />
      </Field>

      <Field label="학번 *" htmlFor="student_id" hint="학부 기준. (예: 20230000)">
        <Input
          id="student_id"
          name="student_id"
          required
          inputMode="numeric"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
      </Field>

      {state?.error && (
        <div
          role="alert"
          className="bg-surface px-4 py-3 font-body text-sm text-accent"
        >
          {errorText(state.error)}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer bg-text-1 px-6 py-4 font-display text-2xl uppercase tracking-tight text-bg transition-opacity hover:opacity-80 disabled:opacity-40 md:text-3xl"
      >
        {pending ? "Submitting…" : "Submit application"}
      </button>

      <p className="font-body text-xs text-text-3">
        댄서명, 장르, 자기소개, 영상은 가입 승인 후 마이 페이지에서 추가합니다.
      </p>
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

function RadioCard({
  name,
  value,
  label,
  sub,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  sub: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 bg-bg p-4 ${
        checked ? "outline-1 -outline-offset-1 outline-accent" : ""
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-1 size-4 accent-accent"
      />
      <span className="grid gap-1">
        <span className="font-display text-lg tracking-tight text-text-1">
          {label}
        </span>
        <span className="font-body text-xs text-text-3">{sub}</span>
      </span>
    </label>
  );
}
