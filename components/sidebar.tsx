/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FolderKanban, Users, ClipboardList, UserCheck, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const adminNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/checklists", label: "Checklists", icon: ClipboardList },
  { href: "/admin/assignments", label: "Assignments", icon: UserCheck },
];

const staffNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/my-tasks", label: "My Tasks", icon: ClipboardList },
];

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav = profile.role === "admin" ? adminNav : staffNav;
  const initials = profile.full_name.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-white/20 text-white font-medium"
                  : "text-blue-100 hover:bg-white/10"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  function ProfileFooter() {
    return (
      <div className="px-4 py-4 border-t border-[#2d5080]">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-400 text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
            <p className="text-xs text-blue-200 capitalize">{profile.role.replace("_", " ")}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-blue-100 hover:bg-red-500/20 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-[#1e3a5f] text-white flex-col">
        <div className="px-5 py-5 border-b border-[#2d5080] flex items-center gap-3">
          <div className="bg-white rounded-lg p-1 shrink-0">
            <Image src="/logo.png" alt="Nabhangan Engineers logo" width={40} height={40} className="rounded-md" priority />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-base leading-tight truncate">Nabhangan Engineers</p>
            <p className="text-xs text-blue-200 mt-0.5">Workflow Tracker</p>
          </div>
        </div>
        <NavLinks />
        <ProfileFooter />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-[#1e3a5f] text-white border-b border-[#2d5080]">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex items-center justify-center h-10 w-10 -ml-2 rounded-md text-white hover:bg-white/10 transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2 min-w-0 px-2">
          <div className="bg-white rounded-md p-0.5 shrink-0">
            <Image src="/logo.png" alt="Nabhangan Engineers logo" width={26} height={26} className="rounded-sm" priority />
          </div>
          <p className="font-bold text-sm leading-tight truncate">Nabhangan Engineers</p>
        </div>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-blue-400 text-white text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </header>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#1e3a5f] text-white flex flex-col transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#2d5080]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-white rounded-lg p-1 shrink-0">
              <Image src="/logo.png" alt="Nabhangan Engineers logo" width={36} height={36} className="rounded-md" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-base leading-tight truncate">Nabhangan Engineers</p>
              <p className="text-xs text-blue-200 mt-0.5">Workflow Tracker</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex items-center justify-center h-9 w-9 rounded-md text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavLinks onNavigate={() => setOpen(false)} />
        <ProfileFooter />
      </aside>
    </>
  );
}
