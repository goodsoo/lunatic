// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  validateAvatarPath,
  validateProfileInput,
  validateSignupInput,
} from "../validation";

const UID = "11111111-2222-3333-4444-555555555555";

function baseSignup() {
  return {
    real_name: "홍길동",
    cohort_raw: "29",
    country: "KR",
    school: "KAIST",
    student_id: "20240001",
    has_code: "no",
    invite_code: "",
  };
}

describe("validateSignupInput", () => {
  it("accepts a complete payload", () => {
    const r = validateSignupInput(baseSignup());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.invite_code).toBeNull();
      expect(r.data.cohort).toBe(29);
      expect(r.data.school).toBe("KAIST");
    }
  });

  it("accepts half-cohort like 29.5", () => {
    const r = validateSignupInput({ ...baseSignup(), cohort_raw: "29.5" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.cohort).toBe(29.5);
  });

  it("rejects non-half cohort like 29.3", () => {
    const r = validateSignupInput({ ...baseSignup(), cohort_raw: "29.3" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("cohort_invalid");
  });

  it("rejects missing real name", () => {
    const r = validateSignupInput({ ...baseSignup(), real_name: "  " });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("real_name_required");
  });

  it("requires invite code when has_code=yes", () => {
    const r = validateSignupInput({
      ...baseSignup(),
      has_code: "yes",
      invite_code: "  ",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("invite_code_required");
  });

  it("trims invite code and accepts has_code=yes", () => {
    const r = validateSignupInput({
      ...baseSignup(),
      has_code: "yes",
      invite_code: "  ABC123 ",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.invite_code).toBe("ABC123");
  });

  it("defaults school to KAIST when blank", () => {
    const r = validateSignupInput({ ...baseSignup(), school: "  " });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.school).toBe("KAIST");
  });

  it("rejects negative or zero cohort", () => {
    expect(validateSignupInput({ ...baseSignup(), cohort_raw: "0" }).ok).toBe(
      false,
    );
    expect(
      validateSignupInput({ ...baseSignup(), cohort_raw: "-5" }).ok,
    ).toBe(false);
    expect(
      validateSignupInput({ ...baseSignup(), cohort_raw: "abc" }).ok,
    ).toBe(false);
  });
});

function baseProfile() {
  return {
    dancer_name: "popper",
    type: "undergrad",
    genres: ["popping", "hiphop"],
    primary_genre: "popping",
    instagram_handle: "popper",
    bio: "한 줄",
    bio_long: "긴 자기소개",
    video_urls: [
      "https://youtube.com/watch?v=dQw4w9WgXcQ",
      "",
      "  ",
    ],
  };
}

describe("validateProfileInput", () => {
  it("accepts a complete payload and filters empty videos", () => {
    const r = validateProfileInput(baseProfile());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.genres).toEqual(["popping", "hiphop"]);
      expect(r.data.video_urls).toHaveLength(1);
      expect(r.data.instagram_handle).toBe("popper");
    }
  });

  it("rejects when primary genre not in selected genres", () => {
    const r = validateProfileInput({
      ...baseProfile(),
      primary_genre: "locking",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("primary_genre_invalid");
  });

  it("rejects empty genres", () => {
    const r = validateProfileInput({
      ...baseProfile(),
      genres: [],
      primary_genre: "",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("genres_required");
  });

  it("rejects unknown genre slug", () => {
    const r = validateProfileInput({
      ...baseProfile(),
      genres: ["popping", "voguing"],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("genres_invalid");
  });

  it("rejects invalid type", () => {
    const r = validateProfileInput({ ...baseProfile(), type: "phd" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("type_invalid");
  });

  it("rejects bio_long > 200 chars", () => {
    const r = validateProfileInput({
      ...baseProfile(),
      bio_long: "x".repeat(201),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("bio_long_too_long");
  });

  it("rejects more than 3 videos", () => {
    const url = "https://youtube.com/watch?v=dQw4w9WgXcQ";
    const r = validateProfileInput({
      ...baseProfile(),
      video_urls: [url, url, url, url],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("too_many_videos");
  });

  it("collapses whitespace-only optional fields to null", () => {
    const r = validateProfileInput({
      ...baseProfile(),
      instagram_handle: "  ",
      bio: "  ",
      bio_long: "",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.instagram_handle).toBeNull();
      expect(r.data.bio).toBeNull();
      expect(r.data.bio_long).toBeNull();
    }
  });
});

describe("validateAvatarPath", () => {
  it("accepts null (clearing avatar)", () => {
    expect(validateAvatarPath(null, UID)).toBe(true);
  });

  it("accepts path inside user folder with allowed ext", () => {
    expect(validateAvatarPath(`${UID}/123.jpg`, UID)).toBe(true);
    expect(validateAvatarPath(`${UID}/avatar.png`, UID)).toBe(true);
    expect(validateAvatarPath(`${UID}/x.webp`, UID)).toBe(true);
  });

  it("rejects path under different user folder", () => {
    const other = "99999999-9999-9999-9999-999999999999";
    expect(validateAvatarPath(`${other}/foo.jpg`, UID)).toBe(false);
  });

  it("rejects path traversal", () => {
    expect(validateAvatarPath(`${UID}/../bar.jpg`, UID)).toBe(false);
  });

  it("rejects disallowed extensions", () => {
    expect(validateAvatarPath(`${UID}/a.gif`, UID)).toBe(false);
    expect(validateAvatarPath(`${UID}/a.svg`, UID)).toBe(false);
    expect(validateAvatarPath(`${UID}/noext`, UID)).toBe(false);
  });

  it("rejects when userId is not a UUID", () => {
    expect(validateAvatarPath("foo/bar.jpg", "not-a-uuid")).toBe(false);
  });
});
