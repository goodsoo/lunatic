// 유튜브 URL → embed URL/id 추출.
// 지원 포맷:
//   https://www.youtube.com/watch?v=XXXX
//   https://youtu.be/XXXX
//   https://www.youtube.com/shorts/XXXX
//   https://www.youtube.com/embed/XXXX
const ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function youtubeId(url: string): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0];
    return ID_RE.test(id) ? id : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    if (parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v") ?? "";
      return ID_RE.test(id) ? id : null;
    }
    const m = parsed.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/);
    if (m && ID_RE.test(m[1])) return m[1];
  }
  return null;
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
