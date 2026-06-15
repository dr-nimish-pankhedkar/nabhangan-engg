/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrintClient from "./print-client";

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const { data: submission } = await supabase.from("stage_submissions").select("id, revoked_by").eq("project_id", id).eq("stage", "print").maybeSingle();
  const isLocked = !!submission && !submission.revoked_by;
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Print Stage</h1>
      <PrintClient projectId={id} userId={user.id} isLocked={isLocked} />
    </div>
  );
}
