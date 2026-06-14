/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const AssignmentSchema = z.object({
  stage: z.enum(["lead", "survey", "drafting", "report", "review"]),
  user_id: z.string().uuid(),
});

const CreateProjectSchema = z.object({
  bank_name: z.string().min(1).max(200),
  project_address: z.string().min(1).max(1000),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  bank_metadata: z.record(z.string(), z.unknown()),
  assignments: z.array(AssignmentSchema).optional(),
});

export async function createProject(input: {
  bank_name: string;
  project_address: string;
  latitude: number | null;
  longitude: number | null;
  bank_metadata: Record<string, unknown>;
  created_by: string;
  assignments?: { stage: string; user_id: string }[];
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const parsed = CreateProjectSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      bank_name: parsed.data.bank_name,
      project_address: parsed.data.project_address,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      bank_metadata: parsed.data.bank_metadata,
      created_by: user.id,
      status: "lead",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const projectId = data.id;
  if (parsed.data.assignments && parsed.data.assignments.length > 0) {
    const { error: assignError } = await supabase.from("project_assignments").insert(
      parsed.data.assignments.map((a) => ({ project_id: projectId, user_id: a.user_id, stage: a.stage }))
    );
    if (assignError) return { error: assignError.message };
  }

  return { id: projectId };
}
