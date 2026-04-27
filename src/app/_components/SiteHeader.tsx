import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-bg/80 px-4 py-4 backdrop-blur md:px-8">
      <Link
        href="/"
        className="font-logo text-lg lowercase tracking-tight text-text-1"
      >
        real lunatic
      </Link>
      <nav className="flex gap-6 font-body text-xs uppercase tracking-widest text-text-2 md:gap-10 md:text-sm">
        <Link href="/performances" className="hover:text-text-1">
          Performances
        </Link>
        <Link href="/events" className="hover:text-text-1">
          Events
        </Link>
        <Link href="/store" className="hover:text-text-1">
          Store
        </Link>
        <Link href="/about" className="hover:text-text-1">
          About
        </Link>
      </nav>
    </header>
  );
}
