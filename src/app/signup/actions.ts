"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateSignupInput } from "@/lib/validation";

export type SignupState = { error?: string };

function pickRaw(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export async function submitSignup(
  _prev: SignupState | undefined,
  formData: FormData,
): Promise<SignupState> {
  const result = validateSignupInput({
    real_name: pickRaw(formData, "real_name"),
    cohort_raw: pickRaw(formData, "cohort"),
    country: pickRaw(formData, "country"),
    school: pickRaw(formData, "school"),
    student_id: pickRaw(formData, "student_id"),
    has_code: pickRaw(formData, "has_code").trim(),
    invite_code: pickRaw(formData, "invite_code"),
  });
  if (!result.ok) return { error: result.error };
  const v = result.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("signup_member", {
    p_real_name: v.real_name,
    p_cohort: v.cohort,
    p_country: v.country,
    p_school: v.school,
    p_student_id: v.student_id,
    p_invite_code: v.invite_code,
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
