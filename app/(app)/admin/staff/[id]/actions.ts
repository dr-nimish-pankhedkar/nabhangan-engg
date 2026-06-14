/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const MarkAttendanceSchema = z.object({
  staffId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  status: z.enum(["present", "absent", "half_day", "leave"]),
});

export async function markAttendance(input: {
  staffId: string;
  adminId: string;
  date: string;
  status: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const parsed = MarkAttendanceSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const { error } = await supabase.from("attendance").upsert({
    user_id: parsed.data.staffId,
    date: parsed.data.date,
    status: parsed.data.status,
    marked_by: user.id,
  });
  if (error) return { error: error.message };
  return {};
}

export async function uploadStaffDocument(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const file = formData.get("file") as File;
  const staffId = formData.get("staffId") as string;
  const docType = formData.get("docType") as string;

  if (!file || !staffId || !docType) return { error: "Missing required fields" };
  if (!z.string().uuid().safeParse(staffId).success) return { error: "Invalid staff ID" };
  if (file.size > 10 * 1024 * 1024) return { error: "File must be under 10 MB" };

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
    uploaded_by: user.id,
  });
  if (dbError) return { error: dbError.message };
  return {};
}
