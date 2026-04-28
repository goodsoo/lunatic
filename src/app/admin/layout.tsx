import Link from "next/link";
import type { Metadata } from "next";
import { requireAdminOrOwner } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin — Real Lunatic",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminOrOwner();
  return (
    <div className="pt-32">
      <nav className="border-b border-text-3/30 px-4 pb-4 md:px-8">
        <ul className="flex items-center gap-6 font-body text-xs uppercase tracking-widest text-text-3">
          <li className="text-text-1">admin</li>
          <li>
            <Link href="/admin/events" className="hover:text-text-1">
              Events
            </Link>
          </li>
        </ul>
      </nav>
      {children}
    </div>
  );
}
