/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ProjectStatus } from "@/lib/types";
import { z } from "zod";

const UUIDSchema = z.string().uuid();

const CreateAssignmentSchema = z.object({
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  stage: z.enum(["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch", "fees_received"]),
});

const ReviewRequestSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

export async function createAssignment(input: {
  project_id: string;
  user_id: string;
  stage: ProjectStatus;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", user.id).single();
  if (!profile?.is_active) return { error: "Account is inactive." };

  const parsed = CreateAssignmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const admin = await createAdminClient();
  const { error } = await admin.from("project_assignments").insert(parsed.data);
  if (error) return { error: error.message };

  // Auto-advance lead → survey when survey staff is assigned
  if (parsed.data.stage === "survey") {
    const { data: proj } = await admin.from("projects").select("status").eq("id", parsed.data.project_id).single();
    if (proj?.status === "lead") {
      await admin.from("projects").update({ status: "survey" }).eq("id", parsed.data.project_id);
    }
  }

  return {};
}

export async function reviewTaskRequest(input: {
  requestId: string;
  adminId: string;
  status: "approved" | "rejected";
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", user.id).single();
  if (!profile?.is_active) return { error: "Account is inactive." };

  const parsed = ReviewRequestSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const { error } = await supabase
    .from("task_requests")
    .update({ status: parsed.data.status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", parsed.data.requestId);
  if (error) return { error: error.message };
  return {};
}

export async function removeAssignment(assignmentId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", user.id).single();
  if (!profile?.is_active) return { error: "Account is inactive." };
  if (!UUIDSchema.safeParse(assignmentId).success) return { error: "Invalid ID" };
  const admin = await createAdminClient();
  const { error } = await admin.from("project_assignments").delete().eq("id", assignmentId);
  if (error) return { error: error.message };
  return {};
}
