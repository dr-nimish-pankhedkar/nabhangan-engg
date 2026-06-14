/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { ProjectStatus } from "@/lib/types";
import { z } from "zod";

const ChecklistFieldSchema = z.object({
  label: z.string().min(1).max(200),
  type: z.enum(["text", "number", "boolean", "select"]),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  stage: z.enum(["lead", "survey", "drafting", "report", "review"]),
  fields: z.array(ChecklistFieldSchema).min(1),
});

export async function createTemplate(input: {
  name: string;
  stage: ProjectStatus;
  fields: object[];
  created_by: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const parsed = CreateTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const { error } = await supabase.from("checklist_templates").insert({
    name: parsed.data.name,
    stage: parsed.data.stage,
    fields: parsed.data.fields,
    created_by: user.id,
  });
  if (error) return { error: error.message };
  return {};
}
