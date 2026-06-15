/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RateVerificationClient from "./rate-verification-client";

export default async function RateVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const { data: submission } = await supabase.from("stage_submissions").select("id, revoked_by").eq("project_id", id).eq("stage", "rate_verification").maybeSingle();
  const isLocked = !!submission && !submission.revoked_by;
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Rate Verification</h1>
      <RateVerificationClient projectId={id} userId={user.id} isLocked={isLocked} />
    </div>
  );
}
