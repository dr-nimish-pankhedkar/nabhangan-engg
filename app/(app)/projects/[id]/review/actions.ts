/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function markComplete(projectId: string) {
  const supabase = await createClient();
  await supabase.from("projects").update({ status: "review" }).eq("id", projectId);
  redirect(`/projects/${projectId}`);
}
