/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";

export async function markAttendance(input: {
  staffId: string;
  adminId: string;
  date: string;
  status: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("attendance")
    .upsert({ user_id: input.staffId, date: input.date, status: input.status, marked_by: input.adminId });
  if (error) return { error: error.message };
  return {};
}

export async function uploadStaffDocument(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const file = formData.get("file") as File;
  const staffId = formData.get("staffId") as string;
  const adminId = formData.get("adminId") as string;
  const docType = formData.get("docType") as string;

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `staff/${staffId}/${docType}/${timestamp}_${safeName}`;

  const fileBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(filePath, fileBuffer, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await supabase.from("staff_documents").insert({
    user_id: staffId,
    doc_type: docType,
    file_path: filePath,
    file_name: file.name,
    file_size: file.size,
    uploaded_by: adminId,
  });

  if (dbError) return { error: dbError.message };
  return {};
}
