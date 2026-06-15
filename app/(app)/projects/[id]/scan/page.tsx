/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ScanClient from "./scan-client";
import StagePendingCard from "../stage-pending-card";

const BUCKET = "project-files";
const STAGE_ORDER = ["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch"];
const THIS_STAGE_IDX = 6; // scan

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const [submissionRes, prevFilesRes, projectRes, profileRes] = await Promise.all([
    supabase.from("stage_submissions").select("id, revoked_by").eq("project_id", id).eq("stage", "scan").maybeSingle(),
    supabase.from("project_files").select("id, file_name, file_path, file_type, stage, uploaded_at").eq("project_id", id).in("stage", ["survey", "rate_verification", "drafting", "print"]).order("uploaded_at"),
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
        <h1 className="text-xl font-semibold text-slate-800 mb-6">Scan Stage</h1>
        <StagePendingCard activeStage={projectRes.data?.status ?? "lead"} assignedTo={assignedTo} />
      </div>
    );
  }

  const isLocked = !!submissionRes.data && !submissionRes.data.revoked_by;

  const refFiles = await Promise.all(
    (prevFilesRes.data || []).map(async (f: any) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(f.file_path, 604800);
      return { ...f, signedUrl: data?.signedUrl || null };
    })
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Scan Stage</h1>
      <ScanClient projectId={id} userId={user.id} isLocked={isLocked} refFiles={refFiles} />
    </div>
  );
}
