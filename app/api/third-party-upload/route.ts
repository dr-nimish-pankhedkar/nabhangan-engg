/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const BUCKET = "project-files";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const token = formData.get("token") as string | null;
  const file = formData.get("file") as File | null;

  if (!token || !file) {
    return NextResponse.json({ error: "Missing token or file" }, { status: 400 });
  }
  if (!z.string().uuid().safeParse(token).success) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }

  const admin = await createAdminClient();

  const { data: tokenRow } = await admin
    .from("third_party_tokens")
    .select("id, project_id, expires_at, used_at, created_by")
    .eq("token", token)
    .single();

  if (!tokenRow || tokenRow.used_at || new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${tokenRow.project_id}/survey/${Date.now()}_${safeName}`;

  const { error: storageError } = await admin.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: false });
  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  const { error: dbError } = await admin.from("project_files").insert({
    project_id: tokenRow.project_id,
    user_id: tokenRow.created_by,
    stage: "survey",
    file_path: filePath,
    file_name: file.name,
    file_type: file.type,
  });
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ fileName: file.name });
}
