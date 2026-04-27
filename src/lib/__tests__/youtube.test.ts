// @vitest-environment node
import { describe, expect, it } from "vitest";
import { youtubeEmbedUrl, youtubeId } from "../youtube";

describe("youtubeId", () => {
  it("parses watch URLs", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(youtubeId("https://youtube.com/watch?v=dQw4w9WgXcQ&t=10")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("parses youtu.be short URLs", () => {
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ?si=foo")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("parses shorts and embed URLs", () => {
    expect(youtubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(youtubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("trims whitespace and tolerates m. subdomain", () => {
    expect(youtubeId("  https://m.youtube.com/watch?v=dQw4w9WgXcQ  ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("rejects invalid IDs and non-youtube URLs", () => {
    expect(youtubeId("")).toBeNull();
    expect(youtubeId("not a url")).toBeNull();
    expect(youtubeId("https://vimeo.com/dQw4w9WgXcQ")).toBeNull();
    expect(youtubeId("https://youtube.com/watch?v=tooshort")).toBeNull();
    expect(youtubeId("https://youtube.com/watch")).toBeNull();
    expect(youtubeId("https://youtu.be/")).toBeNull();
  });
});

describe("youtubeEmbedUrl", () => {
  it("returns embed URL for a valid id", () => {
    expect(
      youtubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("returns null for invalid input", () => {
    expect(youtubeEmbedUrl("garbage")).toBeNull();
  });
});
