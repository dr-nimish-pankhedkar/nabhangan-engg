/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { ProjectStatus } from "@/lib/types";

export async function submitTaskRequest(input: {
  userId: string;
  project_id?: string;
  stage?: ProjectStatus;
  message: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("task_requests").insert({
    user_id: input.userId,
    project_id: input.project_id || null,
    stage: input.stage || null,
    message: input.message,
  });
  if (error) return { error: error.message };
  return {};
}
