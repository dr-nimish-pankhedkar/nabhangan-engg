/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { ProjectStatus } from "@/lib/types";
import { z } from "zod";

const SubmitRequestSchema = z.object({
  project_id: z.string().uuid().optional(),
  stage: z.enum(["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch"]).optional(),
  message: z.string().min(1).max(2000),
});

export async function submitTaskRequest(input: {
  userId: string;
  project_id?: string;
  stage?: ProjectStatus;
  message: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const parsed = SubmitRequestSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const { error } = await supabase.from("task_requests").insert({
    user_id: user.id,
    project_id: parsed.data.project_id || null,
    stage: parsed.data.stage || null,
    message: parsed.data.message,
  });
  if (error) return { error: error.message };
  return {};
}
