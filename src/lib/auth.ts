import { createClient } from "@/lib/supabase/server";

export type MemberSummary = {
  id: string;
  dancer_name: string;
  application_status: "pending" | "approved" | "rejected";
  role: "owner" | "admin" | "member";
};

export async function getUserAndMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, member: null as MemberSummary | null };
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, dancer_name, application_status, role")
    .eq("id", user.id)
    .maybeSingle<MemberSummary>();

  return { user, member: member ?? null };
}
