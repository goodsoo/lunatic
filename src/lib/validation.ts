import { GENRES, type GenreSlug } from "./genres";

const GENRE_SET = new Set<string>(GENRES.map((g) => g.slug));
const TYPES = new Set(["undergrad", "grad", "other"]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SignupInput = {
  real_name: string;
  cohort_raw: string;
  country: string;
  school: string;
  student_id: string;
  has_code: string;
  invite_code: string;
};

export type ValidatedSignup = {
  real_name: string;
  cohort: number;
  country: string;
  school: string;
  student_id: string;
  invite_code: string | null;
};

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function validateSignupInput(
  raw: SignupInput,
): ValidationResult<ValidatedSignup> {
  const real_name = raw.real_name.trim();
  const country = raw.country.trim();
  const school = (raw.school.trim() || "KAIST");
  const student_id = raw.student_id.trim();
  const cohort = Number(raw.cohort_raw);
  const invite_code =
    raw.has_code === "yes" ? raw.invite_code.trim() : "";

  if (!real_name) return { ok: false, error: "real_name_required" };
  if (
    !Number.isFinite(cohort) ||
    cohort <= 0 ||
    cohort * 2 !== Math.trunc(cohort * 2)
  ) {
    return { ok: false, error: "cohort_invalid" };
  }
  if (!country) return { ok: false, error: "country_required" };
  if (!school) return { ok: false, error: "school_required" };
  if (!student_id) return { ok: false, error: "student_id_required" };
  if (raw.has_code === "yes" && !invite_code) {
    return { ok: false, error: "invite_code_required" };
  }

  return {
    ok: true,
    data: {
      real_name,
      cohort,
      country,
      school,
      student_id,
      invite_code: invite_code || null,
    },
  };
}

export type ProfileInput = {
  dancer_name: string;
  type: string;
  genres: string[];
  primary_genre: string;
  instagram_handle: string;
  bio: string;
  bio_long: string;
  video_urls: string[];
};

export type ValidatedProfile = {
  dancer_name: string;
  type: "undergrad" | "grad" | "other";
  genres: GenreSlug[];
  primary_genre: GenreSlug;
  instagram_handle: string | null;
  bio: string | null;
  bio_long: string | null;
  video_urls: string[];
};

export function validateProfileInput(
  raw: ProfileInput,
): ValidationResult<ValidatedProfile> {
  const dancer_name = raw.dancer_name.trim();
  const type = raw.type.trim();
  const genres = raw.genres.map((g) => g.trim()).filter(Boolean);
  const primary_genre = raw.primary_genre.trim();
  const instagram_handle = raw.instagram_handle.trim();
  const bio = raw.bio.trim();
  const bio_long = raw.bio_long.trim();
  const video_urls = raw.video_urls.map((v) => v.trim()).filter(Boolean);

  if (!dancer_name) return { ok: false, error: "dancer_name_required" };
  if (!TYPES.has(type)) return { ok: false, error: "type_invalid" };
  if (genres.length === 0) return { ok: false, error: "genres_required" };
  if (!genres.every((g) => GENRE_SET.has(g))) {
    return { ok: false, error: "genres_invalid" };
  }
  if (!primary_genre || !genres.includes(primary_genre)) {
    return { ok: false, error: "primary_genre_invalid" };
  }
  if (bio_long.length > 200) {
    return { ok: false, error: "bio_long_too_long" };
  }
  if (video_urls.length > 3) {
    return { ok: false, error: "too_many_videos" };
  }

  return {
    ok: true,
    data: {
      dancer_name,
      type: type as ValidatedProfile["type"],
      genres: genres as GenreSlug[],
      primary_genre: primary_genre as GenreSlug,
      instagram_handle: instagram_handle || null,
      bio: bio || null,
      bio_long: bio_long || null,
      video_urls,
    },
  };
}

export function validateAvatarPath(
  path: string | null,
  userId: string,
): boolean {
  if (path === null) return true;
  if (typeof path !== "string") return false;
  if (!UUID_RE.test(userId)) return false;
  if (!path.startsWith(`${userId}/`)) return false;
  if (path.includes("..")) return false;
  if (path.length > 256) return false;
  const ext = path.split(".").pop()?.toLowerCase();
  if (!ext || !["jpg", "jpeg", "png", "webp"].includes(ext)) return false;
  return true;
}
