import Link from "next/link";

import { requireStaff } from "@/lib/auth";
import { siteConfig } from "@/lib/site";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStaff();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-muted/20 p-4 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            {siteConfig.shortName}
          </span>
          Admin
        </Link>
        <AdminSidebar />
        <div className="mt-auto border-t pt-4 text-xs text-muted-foreground">
          <div className="truncate font-medium text-foreground">
            {profile.full_name ?? profile.email}
          </div>
          <div className="capitalize">{profile.role}</div>
        </div>
      </aside>
      <div className="flex-1 overflow-x-hidden">
        <div className="container max-w-6xl py-8">{children}</div>
      </div>
    </div>
  );
}
