/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SurveyStageClient from "./survey-client";

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const [projectRes, svrRes, photosRes, submissionRes] = await Promise.all([
    supabase.from("projects").select("*, profiles(full_name)").eq("id", id).single(),
    supabase.from("site_visit_reports").select("*").eq("project_id", id).maybeSingle(),
    supabase.from("project_files").select("id, file_name, file_path, uploaded_at").eq("project_id", id).eq("stage", "survey").like("file_type", "image/%").order("uploaded_at"),
    supabase.from("stage_submissions").select("id, revoked_by").eq("project_id", id).eq("stage", "survey").maybeSingle(),
  ]);

  if (!projectRes.data) notFound();

  const existingPhotos = photosRes.data || [];
  const isLocked = !!submissionRes.data && !submissionRes.data.revoked_by;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Site Visit Report</h1>
      <SurveyStageClient
        projectId={id}
        userId={user.id}
        project={projectRes.data}
        existingReport={svrRes.data?.data || null}
        existingPhotos={existingPhotos}
        isLocked={isLocked}
      />
    </div>
  );
}
