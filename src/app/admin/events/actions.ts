"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdminOrOwner } from "@/lib/auth";
import { validateEventInput } from "@/lib/validation";

export type EventActionState = { error?: string; ok?: boolean };

function pickRaw(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function readEventForm(formData: FormData) {
  return validateEventInput({
    slug: pickRaw(formData, "slug"),
    title: pickRaw(formData, "title"),
    kind: pickRaw(formData, "kind"),
    starts_at: pickRaw(formData, "starts_at"),
    ends_at: pickRaw(formData, "ends_at"),
    location: pickRaw(formData, "location"),
    description: pickRaw(formData, "description"),
    is_public: pickRaw(formData, "is_public"),
    genres: formData.getAll("genres").map(String),
  });
}

export async function createEvent(
  _prev: EventActionState | undefined,
  formData: FormData,
): Promise<EventActionState> {
  const { user } = await requireAdminOrOwner();
  const result = readEventForm(formData);
  if (!result.ok) return { error: result.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .insert({ ...result.data, created_by: user.id });

  if (error) {
    if (error.code === "23505") return { error: "slug_taken" };
    return { error: error.message };
  }

  revalidatePath("/admin/events");
  revalidatePath("/events");
  redirect("/admin/events");
}

export async function updateEvent(
  id: string,
  _prev: EventActionState | undefined,
  formData: FormData,
): Promise<EventActionState> {
  await requireAdminOrOwner();
  const result = readEventForm(formData);
  if (!result.ok) return { error: result.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "slug_taken" };
    return { error: error.message };
  }

  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { ok: true };
}

export async function deleteEvent(id: string): Promise<EventActionState> {
  await requireAdminOrOwner();
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  revalidatePath("/events");
  redirect("/admin/events");
}
