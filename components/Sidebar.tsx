"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  LayoutDashboard,
  FolderKanban,
  Settings,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/projects", label: "내 프로젝트", icon: FolderKanban },
  { href: "/settings", label: "설정", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("사용자");
  const [initial, setInitial] = useState("?");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name =
        (user.user_metadata?.display_name as string) ||
        user.email?.split("@")[0] ||
        "사용자";
      setDisplayName(name);
      setInitial(name.charAt(0).toUpperCase());
    });
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <FileSpreadsheet className="h-7 w-7 text-blue-600" aria-hidden />
        <div>
          <p className="text-sm font-bold text-gray-900">AI 엑셀 분석</p>
          <p className="text-xs text-gray-500">견적·내역 분석</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {displayName}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600"
            >
              <LogOut className="h-3 w-3" aria-hidden />
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
