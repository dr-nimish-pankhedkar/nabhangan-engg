/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { ProjectStatus } from "@/lib/types";

export async function createAssignment(input: {
  project_id: string;
  user_id: string;
  stage: ProjectStatus;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_assignments").insert(input);
  if (error) return { error: error.message };
  return {};
}

export async function reviewTaskRequest(input: {
  requestId: string;
  adminId: string;
  status: "approved" | "rejected";
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("task_requests")
    .update({ status: input.status, reviewed_by: input.adminId, reviewed_at: new Date().toISOString() })
    .eq("id", input.requestId);
  if (error) return { error: error.message };
  return {};
}
