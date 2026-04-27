"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateAvatarPath, validateProfileInput } from "@/lib/validation";

export type ProfileState = { error?: string; ok?: boolean };
export type AvatarState = { error?: string; ok?: boolean };

function pickRaw(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export async function updateMyProfile(
  _prev: ProfileState | undefined,
  formData: FormData,
): Promise<ProfileState> {
  const result = validateProfileInput({
    dancer_name: pickRaw(formData, "dancer_name"),
    type: pickRaw(formData, "type"),
    genres: formData.getAll("genres").map(String),
    primary_genre: pickRaw(formData, "primary_genre"),
    instagram_handle: pickRaw(formData, "instagram_handle"),
    bio: pickRaw(formData, "bio"),
    bio_long: pickRaw(formData, "bio_long"),
    video_urls: [
      pickRaw(formData, "video_url_1"),
      pickRaw(formData, "video_url_2"),
      pickRaw(formData, "video_url_3"),
    ],
  });
  if (!result.ok) return { error: result.error };
  const v = result.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_my_profile", {
    p_dancer_name: v.dancer_name,
    p_type: v.type,
    p_genres: v.genres,
    p_primary_genre: v.primary_genre,
    p_instagram_handle: v.instagram_handle,
    p_bio: v.bio,
    p_bio_long: v.bio_long,
    p_video_urls: v.video_urls,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/me");
  return { ok: true };
}

export async function updateAvatar(
  path: string | null,
): Promise<AvatarState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "login_required" };

  if (!validateAvatarPath(path, user.id)) {
    return { error: "path_invalid" };
  }

  const previous = await supabase
    .from("members")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle<{ avatar_url: string | null }>();

  const { error } = await supabase
    .from("members")
    .update({ avatar_url: path })
    .eq("id", user.id);

  if (error) {
    return { error: "update_failed" };
  }

  const oldPath = previous.data?.avatar_url;
  if (oldPath && oldPath !== path) {
    await supabase.storage.from("avatars").remove([oldPath]);
  }

  revalidatePath("/me");
  return { ok: true };
}
