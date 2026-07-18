/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SurveyStageClient from "./survey-client";
import StagePendingCard from "../stage-pending-card";
import RealtimeProjectRefresh from "@/components/realtime-project-refresh";

const STAGE_ORDER = ["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch", "fees_received"];
const THIS_STAGE_IDX = 1; // survey

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const [projectRes, svrRes, photosRes, submissionRes, profileRes] = await Promise.all([
    supabase.from("projects").select("*, profiles(full_name)").eq("id", id).single(),
    supabase.from("site_visit_reports").select("*").eq("project_id", id).maybeSingle(),
    supabase.from("project_files").select("id, file_name, file_path, uploaded_at").eq("project_id", id).eq("stage", "survey").like("file_type", "image/%").order("uploaded_at"),
    supabase.from("stage_submissions").select("id, revoked_by").eq("project_id", id).eq("stage", "survey").maybeSingle(),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  if (!projectRes.data) notFound();

  const existingPhotos = photosRes.data || [];
  const isSubmitted = !!submissionRes.data && !submissionRes.data.revoked_by;
  const lastUpdatedAt = svrRes.data?.updated_at ?? null;

  return (
    <div className="max-w-2xl">
      <RealtimeProjectRefresh projectId={id} />
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Site Visit Report</h1>
      <SurveyStageClient
        projectId={id}
        userId={user.id}
        project={projectRes.data}
        existingReport={svrRes.data?.data || null}
        existingPhotos={existingPhotos}
        isSubmitted={isSubmitted}
        lastUpdatedAt={lastUpdatedAt}
        customFields={(projectRes.data.bank_metadata as any)?.custom_fields || []}
      />
    </div>
  );
}
