/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const AddSchema = z.object({
  user_id: z.string().uuid(),
  task_description: z.string().min(1).max(500),
});

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: "Unauthenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { supabase, user, error: "Forbidden" };
  return { supabase, user, error: null };
}

export async function addOtherAssignment(input: {
  user_id: string;
  task_description: string;
}): Promise<{ error?: string }> {
  const { supabase, user, error } = await requireAdmin();
  if (error || !user) return { error: error ?? "Unauthenticated" };

  const parsed = AddSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const { error: dbError } = await supabase
    .from("other_assignments")
    .insert({
      user_id: parsed.data.user_id,
      task_description: parsed.data.task_description,
      assigned_by: user.id,
    });

  if (dbError) return { error: dbError.message };
  revalidatePath("/admin/assignments");
  return {};
}

export async function removeOtherAssignment(id: string): Promise<{ error?: string }> {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };

  if (!z.string().uuid().safeParse(id).success) return { error: "Invalid ID" };

  const { error: dbError } = await supabase.from("other_assignments").delete().eq("id", id);
  if (dbError) return { error: dbError.message };
  revalidatePath("/admin/assignments");
  return {};
}
