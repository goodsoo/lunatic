import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signInWithGoogle, signOut } from "@/app/auth/actions";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-bg/80 px-4 py-4 backdrop-blur md:px-8">
      <Link
        href="/"
        className="font-logo text-lg lowercase tracking-tight text-text-1"
      >
        real lunatic
      </Link>
      <nav className="flex items-center gap-6 font-body text-xs uppercase tracking-widest text-text-2 md:gap-10 md:text-sm">
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
        <span className="hidden h-3 w-px bg-text-3/40 md:inline-block" />
        {user ? (
          <form action={signOut} className="flex items-center gap-3">
            <span
              className="hidden max-w-[140px] truncate text-text-3 md:inline"
              title={user.email ?? ""}
            >
              {user.email}
            </span>
            <button
              type="submit"
              className="cursor-pointer hover:text-text-1"
            >
              Sign out
            </button>
          </form>
        ) : (
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="cursor-pointer text-accent hover:opacity-70"
            >
              Sign in
            </button>
          </form>
        )}
      </nav>
    </header>
  );
}
