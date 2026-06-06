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
}

export async function createProject(input: CreateProjectInput): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...input, status: "lead" })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}
