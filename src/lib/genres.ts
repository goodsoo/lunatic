// 9 장르 — DB enum과 1:1. 순서는 동아리 표기 관례.
export const GENRES = [
  { slug: "popping", labelEn: "POPPING", labelKr: "팝핀" },
  { slug: "locking", labelEn: "LOCKING", labelKr: "락킹" },
  { slug: "soul", labelEn: "SOUL", labelKr: "소울" },
  { slug: "waacking", labelEn: "WAACKING", labelKr: "왁킹" },
  { slug: "breaking", labelEn: "BREAKING", labelKr: "브레이킨" },
  { slug: "girls_hiphop", labelEn: "GIRLS HIPHOP", labelKr: "걸스힙합" },
  { slug: "hiphop", labelEn: "HIPHOP", labelKr: "힙합" },
  { slug: "house", labelEn: "HOUSE", labelKr: "하우스" },
  { slug: "krump", labelEn: "KRUMP", labelKr: "크럼프" },
] as const;

export type GenreSlug = (typeof GENRES)[number]["slug"];
