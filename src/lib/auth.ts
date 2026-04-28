import { redirect } from "next/navigation";
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

export function isAdminOrOwner(member: MemberSummary | null): boolean {
  if (!member) return false;
  if (member.application_status !== "approved") return false;
  return member.role === "admin" || member.role === "owner";
}

export async function requireAdminOrOwner() {
  const { user, member } = await getUserAndMember();
  if (!user) redirect("/auth/error?reason=login_required");
  if (!member) redirect("/signup");
  if (!isAdminOrOwner(member)) redirect("/auth/error?reason=forbidden");
  return { user, member };
}
