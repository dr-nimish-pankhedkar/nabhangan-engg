/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function toggleActive(userId: string, isActive: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };
  if (!z.string().uuid().safeParse(userId).success) return { error: "Invalid user ID" };
  if (typeof isActive !== "boolean") return { error: "Invalid input" };
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
  if (error) return { error: error.message };
  return {};
}
