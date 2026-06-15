/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DraftingClient from "./drafting-client";

const BUCKET = "project-files";

export default async function DraftingPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const [surveyPhotosRes, siteVisitReportRes, submissionRes] = await Promise.all([
    supabase.from("project_files").select("id, file_name, file_path, file_type, uploaded_at, profiles(full_name)").eq("project_id", id).eq("stage", "survey").like("file_type", "image/%").order("uploaded_at"),
    supabase.from("site_visit_reports").select("data").eq("project_id", id).maybeSingle(),
    supabase.from("stage_submissions").select("id, revoked_by").eq("project_id", id).eq("stage", "drafting").maybeSingle(),
  ]);

  const photosWithUrls = await Promise.all(
    (surveyPhotosRes.data || []).map(async (photo: any) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(photo.file_path, 3600);
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
