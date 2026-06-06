/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SurveyStageClient from "./survey-client";

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const { data: templates } = await supabase
    .from("checklist_templates")
    .select("*")
    .eq("stage", "survey");

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Survey Stage</h1>
      <SurveyStageClient projectId={id} userId={user.id} templates={templates || []} />
    </div>
  );
}
