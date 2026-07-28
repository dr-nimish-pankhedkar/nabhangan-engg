/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import FeesReceivedClient from "./fees-received-client";
import StagePendingCard from "../stage-pending-card";
import RealtimeProjectRefresh from "@/components/realtime-project-refresh";

const STAGE_ORDER = ["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch", "fees_received"];
const THIS_STAGE_IDX = 8; // fees_received

export default async function FeesReceivedPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? await createAdminClient() : supabase;

  const [submissionRes, projectRes, profileRes] = await Promise.all([
    supabase.from("stage_submissions").select("id, revoked_by").eq("project_id", id).eq("stage", "fees_received").maybeSingle(),
    db.from("projects").select("status").eq("id", id).single(),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  const isAdmin = profileRes.data?.role === "admin";
  const projectStageIdx = STAGE_ORDER.indexOf(projectRes.data?.status ?? "lead");

  if (!isAdmin && projectStageIdx < THIS_STAGE_IDX) {
    const { data: assignment } = await db
      .from("project_assignments")
      .select("profiles(full_name)")
      .eq("project_id", id)
      .eq("stage", projectRes.data?.status ?? "lead")
      .maybeSingle();
    const assignedTo = (assignment as any)?.profiles?.full_name ?? null;
    return (
      <div className="max-w-2xl">
        <RealtimeProjectRefresh projectId={id} />
        <h1 className="text-xl font-semibold text-slate-800 mb-6">Fees Received</h1>
        <StagePendingCard activeStage={projectRes.data?.status ?? "lead"} assignedTo={assignedTo} />
      </div>
    );
  }

  const isLocked = !!submissionRes.data && !submissionRes.data.revoked_by;
  return (
    <div className="max-w-2xl">
      <RealtimeProjectRefresh projectId={id} />
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Fees Received</h1>
      <FeesReceivedClient projectId={id} userId={user.id} isLocked={isLocked} />
    </div>
  );
}
