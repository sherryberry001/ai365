"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Settings,
  Trophy,
} from "lucide-react";

import { adminNav } from "@/lib/site";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ElementType> = {
  "/admin": LayoutDashboard,
  "/admin/content": FileText,
  "/admin/approvals": CheckSquare,
  "/admin/automation": Bot,
  "/admin/mvp": Trophy,
  "/admin/analytics": BarChart3,
  "/admin/settings": Settings,
};

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {adminNav.map((item) => {
        const Icon = ICONS[item.href] ?? LayoutDashboard;
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
