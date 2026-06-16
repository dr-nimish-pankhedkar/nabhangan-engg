/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import ThirdPartySurveyClient from "./third-party-client";

export default async function ThirdPartyAccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = await createAdminClient();

  const { data: tokenRow } = await admin
    .from("third_party_tokens")
    .select("id, project_id, expires_at, used_at, created_by")
    .eq("token", token)
    .single();

  if (!tokenRow) return notFound();

  if (tokenRow.used_at) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-2">
        <h1 className="text-xl font-semibold text-slate-800">Link Already Used</h1>
        <p className="text-sm text-slate-500">
          This survey link has already been submitted and is no longer active.
          Contact the office if you need to make corrections.
        </p>
      </div>
    );
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-2">
        <h1 className="text-xl font-semibold text-slate-800">Link Expired</h1>
        <p className="text-sm text-slate-500">
          This survey link has expired. Please contact the office to receive a new link.
        </p>
      </div>
    );
  }

  const [projectRes, svrRes, photosRes] = await Promise.all([
    admin.from("projects").select("*").eq("id", tokenRow.project_id).single(),
    admin
      .from("site_visit_reports")
      .select("*")
      .eq("project_id", tokenRow.project_id)
      .maybeSingle(),
    admin
      .from("project_files")
      .select("id, file_name, file_path, uploaded_at")
      .eq("project_id", tokenRow.project_id)
      .eq("stage", "survey")
      .like("file_type", "image/%")
      .order("uploaded_at"),
  ]);

  if (!projectRes.data) return notFound();

  const hoursLeft = Math.max(
    0,
    Math.round((new Date(tokenRow.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-100 rounded-md flex items-center justify-between gap-3">
        <p className="text-xs text-blue-700">Third-party survey access · Fill and submit your site visit report below.</p>
        <p className="text-xs text-slate-400 shrink-0">Expires in ~{hoursLeft}h</p>
      </div>
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Site Visit Report</h1>
      <ThirdPartySurveyClient
        accessToken={token}
        projectId={tokenRow.project_id}
        project={projectRes.data}
        existingReport={(svrRes.data as any)?.data || null}
        existingPhotos={photosRes.data || []}
        customFields={(projectRes.data.bank_metadata as any)?.custom_fields || []}
      />
    </div>
  );
}
