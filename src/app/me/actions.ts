"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { GENRES, type GenreSlug } from "@/lib/genres";

const GENRE_SET = new Set<string>(GENRES.map((g) => g.slug));
const TYPES = new Set(["undergrad", "grad", "other"]);

export type ProfileState = { error?: string; ok?: boolean };

function pick(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function updateMyProfile(
  _prev: ProfileState | undefined,
  formData: FormData,
): Promise<ProfileState> {
  const dancer_name = pick(formData, "dancer_name");
  const type = pick(formData, "type");
  const genres = formData.getAll("genres").map(String) as GenreSlug[];
  const primary_genre = pick(formData, "primary_genre") as GenreSlug;
  const instagram_handle = pick(formData, "instagram_handle") || null;
  const bio = pick(formData, "bio") || null;
  const bio_long = pick(formData, "bio_long") || null;
  const video_urls = [
    pick(formData, "video_url_1"),
    pick(formData, "video_url_2"),
    pick(formData, "video_url_3"),
  ].filter(Boolean);

  if (!dancer_name) return { error: "dancer_name_required" };
  if (!TYPES.has(type)) return { error: "type_invalid" };
  if (genres.length === 0) return { error: "genres_required" };
  if (!genres.every((g) => GENRE_SET.has(g))) return { error: "genres_invalid" };
  if (!primary_genre || !genres.includes(primary_genre)) {
    return { error: "primary_genre_invalid" };
  }
  if (bio_long && bio_long.length > 200) return { error: "bio_long_too_long" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_my_profile", {
    p_dancer_name: dancer_name,
    p_type: type,
    p_genres: genres,
    p_primary_genre: primary_genre,
    p_instagram_handle: instagram_handle,
    p_bio: bio,
    p_bio_long: bio_long,
    p_video_urls: video_urls,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/me");
  return { ok: true };
}
