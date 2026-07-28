/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import DraftingClient from "./drafting-client";
import StagePendingCard from "../stage-pending-card";
import RealtimeProjectRefresh from "@/components/realtime-project-refresh";

const BUCKET = "project-files";
const STAGE_ORDER = ["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch", "fees_received"];
const THIS_STAGE_IDX = 3; // drafting

export default async function DraftingPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? await createAdminClient() : supabase;

  const [surveyPhotosRes, siteVisitReportRes, submissionRes, projectRes, profileRes] = await Promise.all([
    db.from("project_files").select("id, file_name, file_path, file_type, uploaded_at, profiles(full_name)").eq("project_id", id).eq("stage", "survey").like("file_type", "image/%").order("uploaded_at"),
    supabase.from("site_visit_reports").select("data").eq("project_id", id).maybeSingle(),
    supabase.from("stage_submissions").select("id, revoked_by").eq("project_id", id).eq("stage", "drafting").maybeSingle(),
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
        <h1 className="text-xl font-semibold text-slate-800 mb-6">Drafting Stage</h1>
        <StagePendingCard activeStage={projectRes.data?.status ?? "lead"} assignedTo={assignedTo} />
      </div>
    );
  }

  const rawPhotos = surveyPhotosRes.data || [];
  const { data: signedUrlsData } = rawPhotos.length > 0
    ? await supabase.storage.from(BUCKET).createSignedUrls(rawPhotos.map((p: any) => p.file_path), 31536000)
    : { data: [] };
  const urlMap = Object.fromEntries((signedUrlsData || []).map((r: any) => [r.path, r.signedUrl]));
  const photosWithUrls = rawPhotos.map((photo: any) => ({ ...photo, signedUrl: urlMap[photo.file_path] || null }));

  const isLocked = !!submissionRes.data && !submissionRes.data.revoked_by;

  return (
    <div className="max-w-2xl">
      <RealtimeProjectRefresh projectId={id} />
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Drafting Stage</h1>
      <DraftingClient
        projectId={id}
        userId={user.id}
        surveyPhotos={photosWithUrls}
        siteVisitData={siteVisitReportRes.data?.data || null}
        isLocked={isLocked}
      />
    </div>
  );
}
