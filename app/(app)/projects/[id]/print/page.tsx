/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrintClient from "./print-client";
import StagePendingCard from "../stage-pending-card";
import RealtimeProjectRefresh from "@/components/realtime-project-refresh";

const BUCKET = "project-files";
const STAGE_ORDER = ["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch", "fees_received"];
const THIS_STAGE_IDX = 5; // print

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const [submissionRes, prevFilesRes, projectRes, profileRes] = await Promise.all([
    supabase.from("stage_submissions").select("id, revoked_by").eq("project_id", id).eq("stage", "print").maybeSingle(),
    supabase.from("project_files").select("id, file_name, file_path, file_type, stage, uploaded_at").eq("project_id", id).in("stage", ["survey", "rate_verification", "drafting"]).order("uploaded_at"),
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
        <RealtimeProjectRefresh projectId={id} />
        <h1 className="text-xl font-semibold text-slate-800 mb-6">Print Stage</h1>
        <StagePendingCard activeStage={projectRes.data?.status ?? "lead"} assignedTo={assignedTo} />
      </div>
    );
  }

  const isLocked = !!submissionRes.data && !submissionRes.data.revoked_by;

  const rawRefFiles = prevFilesRes.data || [];
  const { data: signedUrlsData } = rawRefFiles.length > 0
    ? await supabase.storage.from(BUCKET).createSignedUrls(rawRefFiles.map((f: any) => f.file_path), 31536000)
    : { data: [] };
  const urlMap = Object.fromEntries((signedUrlsData || []).map((r: any) => [r.path, r.signedUrl]));
  const refFiles = rawRefFiles.map((f: any) => ({ ...f, signedUrl: urlMap[f.file_path] || null }));

  return (
    <div className="max-w-2xl">
      <RealtimeProjectRefresh projectId={id} />
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Print Stage</h1>
      <PrintClient projectId={id} userId={user.id} isLocked={isLocked} refFiles={refFiles} />
    </div>
  );
}
