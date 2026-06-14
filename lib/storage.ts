/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { createClient } from "@/lib/supabase/client";
import { ProjectStatus } from "@/lib/types";

const BUCKET = "project-files";

export async function uploadProjectFile(
  projectId: string,
  stage: ProjectStatus,
  file: File
): Promise<string> {
  const supabase = createClient();
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${projectId}/${stage}/${timestamp}_${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: false });

  if (error) throw new Error(error.message);

  // Return the storage path, not a public URL.
  // Signed URLs should be generated server-side on demand.
  return filePath;
}

export async function deleteProjectFile(filePath: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) throw new Error(error.message);
}
