/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DispatchClient from "./dispatch-client";
import StagePendingCard from "../stage-pending-card";

const STAGE_ORDER = ["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch"];
const THIS_STAGE_IDX = 7; // dispatch

export default async function DispatchPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const [submissionRes, projectRes, profileRes] = await Promise.all([
    supabase.from("stage_submissions").select("id, revoked_by").eq("project_id", id).eq("stage", "dispatch").maybeSingle(),
    supabase.from("projects").select("status").eq("id", id).single(),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  const isAdmin = profileRes.data?.role === "admin";
  const projectStageIdx = STAGE_ORDER.indexOf(projectRes.data?.status ?? "lead");

  if (!isAdmin && projectStageIdx < THIS_STAGE_IDX) {
    const { data: assignment } = await supabase
      .from("project_assignments")
      .select("profiles(full_name)")
      .eq("project_id", id)
      .eq("stage", projectRes.data?.status ?? "lead")
      .maybeSingle();
    const assignedTo = (assignment as any)?.profiles?.full_name ?? null;
    return (
      <div className="max-w-2xl">
        <h1 className="text-xl font-semibold text-slate-800 mb-6">Dispatch</h1>
        <StagePendingCard activeStage={projectRes.data?.status ?? "lead"} assignedTo={assignedTo} />
      </div>
    );
  }

  const isLocked = !!submissionRes.data && !submissionRes.data.revoked_by;
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Dispatch</h1>
      <DispatchClient projectId={id} userId={user.id} isLocked={isLocked} />
    </div>
  );
}
