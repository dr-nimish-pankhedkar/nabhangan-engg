/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="flex flex-col md:flex-row md:h-screen bg-white">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col md:overflow-hidden">
        <main className="flex-1 md:overflow-y-auto p-4 md:p-6">
          {children}
        </main>
        <footer className="border-t border-slate-200 px-6 py-3 text-center text-xs text-slate-400">
          © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
