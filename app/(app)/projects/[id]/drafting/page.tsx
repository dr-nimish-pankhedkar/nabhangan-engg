/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DraftingClient from "./drafting-client";
import StagePendingCard from "../stage-pending-card";

const BUCKET = "project-files";
const STAGE_ORDER = ["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch"];
const THIS_STAGE_IDX = 3; // drafting

export default async function DraftingPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const [surveyPhotosRes, siteVisitReportRes, submissionRes, projectRes, profileRes] = await Promise.all([
    supabase.from("project_files").select("id, file_name, file_path, file_type, uploaded_at, profiles(full_name)").eq("project_id", id).eq("stage", "survey").like("file_type", "image/%").order("uploaded_at"),
    supabase.from("site_visit_reports").select("data").eq("project_id", id).maybeSingle(),
    supabase.from("stage_submissions").select("id, revoked_by").eq("project_id", id).eq("stage", "drafting").maybeSingle(),
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
        <h1 className="text-xl font-semibold text-slate-800 mb-6">Drafting Stage</h1>
        <StagePendingCard activeStage={projectRes.data?.status ?? "lead"} assignedTo={assignedTo} />
      </div>
    );
  }

  const photosWithUrls = await Promise.all(
    (surveyPhotosRes.data || []).map(async (photo: any) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(photo.file_path, 31536000);
      return { ...photo, signedUrl: data?.signedUrl || null };
    })
  );

  const isLocked = !!submissionRes.data && !submissionRes.data.revoked_by;

  return (
    <div className="max-w-2xl">
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
