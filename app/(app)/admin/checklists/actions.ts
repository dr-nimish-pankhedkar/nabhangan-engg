/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { ProjectStatus } from "@/lib/types";

export async function createTemplate(input: {
  name: string;
  stage: ProjectStatus;
  fields: object[];
  created_by: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("checklist_templates").insert(input);
  if (error) return { error: error.message };
  return {};
}
