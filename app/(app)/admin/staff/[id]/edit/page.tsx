/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect, notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import EditStaffForm from "./edit-staff-form";

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (adminProfile?.role !== "admin") redirect("/dashboard");

  const { data: staff } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!staff) notFound();

  const adminClient = await createAdminClient();
  const { data: authUser } = await adminClient.auth.admin.getUserById(id);
  const currentEmail = authUser?.user?.email || "";

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Edit: {staff.full_name}</h1>
      <EditStaffForm staff={staff} currentEmail={currentEmail} />
    </div>
  );
}
