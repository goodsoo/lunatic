import Link from "next/link";

export function DancerCard({
  href,
  name,
  cohort,
  bio,
  primaryGenre,
  avatarUrl,
}: {
  href?: string;
  name: string;
  cohort: number;
  bio: string | null;
  primaryGenre: string | null;
  avatarUrl: string | null;
}) {
  const inner = (
    <article className="grid gap-3 p-4 md:p-5">
      <div className="aspect-square w-full overflow-hidden bg-surface">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${name} avatar`}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-display text-5xl tracking-tight text-text-3">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="grid gap-1">
        <h3 className="font-display text-2xl leading-none tracking-tight text-text-1">
          {name}
        </h3>
        <div className="flex items-baseline gap-2 font-body text-xs uppercase tracking-widest text-text-3">
          <span>{cohort}기</span>
          {primaryGenre && (
            <>
              <span aria-hidden>·</span>
              <span className="text-text-2">{primaryGenre}</span>
            </>
          )}
        </div>
        {bio && (
          <p className="mt-1 font-body text-sm text-text-2 line-clamp-2">
            {bio}
          </p>
        )}
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-80">
        {inner}
      </Link>
    );
  }
  return inner;
}
