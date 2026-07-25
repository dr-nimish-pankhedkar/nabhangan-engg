/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import NewProjectForm from "./new-project-form";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const isAdmin = profile.role === "admin";

  const admin = await createAdminClient();
  const staff = (await admin.from("profiles").select("id, full_name, role, designation").eq("is_active", true).order("full_name")).data || [];

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">New Case</h1>
      <NewProjectForm userId={user.id} staff={staff} isAdmin={isAdmin} />
    </div>
  );
}
