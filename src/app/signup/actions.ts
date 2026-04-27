"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignupState = { error?: string };

function pick(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function submitSignup(
  _prev: SignupState | undefined,
  formData: FormData,
): Promise<SignupState> {
  const real_name = pick(formData, "real_name");
  const cohortRaw = pick(formData, "cohort");
  const cohort = Number(cohortRaw);
  const country = pick(formData, "country");
  const school = pick(formData, "school") || "KAIST";
  const student_id = pick(formData, "student_id");
  const has_code = pick(formData, "has_code");
  const invite_code = has_code === "yes" ? pick(formData, "invite_code") : "";

  if (!real_name) return { error: "real_name_required" };
  if (!Number.isFinite(cohort) || cohort <= 0 || cohort * 2 !== Math.trunc(cohort * 2)) {
    return { error: "cohort_invalid" };
  }
  if (!country) return { error: "country_required" };
  if (!school) return { error: "school_required" };
  if (!student_id) return { error: "student_id_required" };
  if (has_code === "yes" && !invite_code) return { error: "invite_code_required" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("signup_member", {
    p_real_name: real_name,
    p_cohort: cohort,
    p_country: country,
    p_school: school,
    p_student_id: student_id,
    p_invite_code: invite_code || null,
  });

  if (error) {
    return { error: error.message };
  }

  const status =
    typeof data === "object" && data !== null && "application_status" in data
      ? (data as { application_status: string }).application_status
      : "pending";

  redirect(status === "approved" ? "/" : "/signup/pending");
}
