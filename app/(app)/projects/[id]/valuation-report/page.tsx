/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ValuationReportClient from "./valuation-report-client";

export default async function ValuationReportPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const [projectRes, svrRes, photosRes, profileRes] = await Promise.all([
    supabase.from("projects").select("*, profiles(full_name)").eq("id", id).single(),
    supabase.from("site_visit_reports").select("*").eq("project_id", id).maybeSingle(),
    supabase.from("project_files")
      .select("id, file_name, file_path, file_type")
      .eq("project_id", id)
      .eq("stage", "survey")
      .like("file_type", "image/%")
      .order("uploaded_at"),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  if (!projectRes.data) notFound();

  const project = projectRes.data;
  const bm: Record<string, string> = (project.bank_metadata as Record<string, string>) || {};
  const report: Record<string, string> = svrRes.data?.data || {};

  const rawPhotos = photosRes.data || [];
  const { data: signedUrlsData } = rawPhotos.length > 0
    ? await supabase.storage.from("project-files").createSignedUrls(rawPhotos.map((f: any) => f.file_path), 3600)
    : { data: [] };
  const urlMap = Object.fromEntries((signedUrlsData || []).map((r: any) => [r.path, r.signedUrl]));
  const photos = rawPhotos.map((f: any) => ({ id: f.id, file_name: f.file_name, signedUrl: urlMap[f.file_path] || null }));

  return (
    <ValuationReportClient
      project={project}
      bankMetadata={bm}
      report={report}
      photos={photos}
      creatorName={(project as any).profiles?.full_name || ""}
      customFields={(project.bank_metadata as any)?.custom_fields || []}
    />
  );
}
