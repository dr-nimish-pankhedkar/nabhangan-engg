/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChangePasswordForm from "./change-password-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-slate-800 mb-1">Account Settings</h1>
      <p className="text-sm text-slate-400 mb-6">{profile?.full_name} · {user.email}</p>
      <ChangePasswordForm />
    </div>
  );
}
