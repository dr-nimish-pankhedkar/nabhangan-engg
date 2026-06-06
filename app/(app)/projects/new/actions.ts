/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";

interface CreateProjectInput {
  bank_name: string;
  project_address: string;
  latitude: number | null;
  longitude: number | null;
  bank_metadata: Record<string, unknown>;
  created_by: string;
  assignments?: { stage: string; user_id: string }[];
}

export async function createProject(input: CreateProjectInput): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      bank_name: input.bank_name,
      project_address: input.project_address,
      latitude: input.latitude,
      longitude: input.longitude,
      bank_metadata: input.bank_metadata,
      created_by: input.created_by,
      status: "lead",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const projectId = data.id;

  if (input.assignments && input.assignments.length > 0) {
    const { error: assignError } = await supabase
      .from("project_assignments")
      .insert(
        input.assignments.map((a) => ({
          project_id: projectId,
          user_id: a.user_id,
          stage: a.stage,
        }))
      );
    if (assignError) return { error: assignError.message };
  }

  return { id: projectId };
}
