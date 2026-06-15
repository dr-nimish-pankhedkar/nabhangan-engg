/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckingClient from "./checking-client";

const BUCKET = "project-files";

export default async function CheckingPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const [submissionRes, prevFilesRes] = await Promise.all([
    supabase.from("stage_submissions").select("id, revoked_by").eq("project_id", id).eq("stage", "checking").maybeSingle(),
    supabase.from("project_files").select("id, file_name, file_path, file_type, stage, uploaded_at").eq("project_id", id).in("stage", ["survey", "rate_verification", "drafting"]).order("uploaded_at"),
  ]);

  const isLocked = !!submissionRes.data && !submissionRes.data.revoked_by;

  const refFiles = await Promise.all(
    (prevFilesRes.data || []).map(async (f: any) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(f.file_path, 3600);
      return { ...f, signedUrl: data?.signedUrl || null };
    })
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Checking Stage</h1>
      <CheckingClient projectId={id} userId={user.id} isLocked={isLocked} refFiles={refFiles} />
    </div>
  );
}
