/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STAGES } from "@/lib/types";

function esc(val: string | null | undefined): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const [projectRes, submissionsRes, timeLogsRes, assignmentsRes, filesRes] = await Promise.all([
    supabase.from("projects").select("bank_name, project_address, created_at, status").eq("id", id).single(),
    supabase.from("stage_submissions").select("stage, submitted_at, revoked_at, revoked_by").eq("project_id", id),
    supabase.from("time_logs").select("stage, hours_spent, profiles(full_name)").eq("project_id", id),
    supabase.from("project_assignments").select("stage, profiles(full_name)").eq("project_id", id),
    supabase.from("project_files").select("stage").eq("project_id", id),
  ]);

  if (!projectRes.data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const project = projectRes.data;
  const submissions = submissionsRes.data || [];
  const timeLogs = timeLogsRes.data || [];
  const assignments = assignmentsRes.data || [];
  const files = filesRes.data || [];

  const subMap: Record<string, any> = {};
  submissions.forEach((s: any) => { subMap[s.stage] = s; });

  const hoursMap: Record<string, number> = {};
  const staffHoursMap: Record<string, string[]> = {};
  timeLogs.forEach((t: any) => {
    hoursMap[t.stage] = (hoursMap[t.stage] || 0) + Number(t.hours_spent);
    const name = (t.profiles as any)?.full_name;
    if (name) {
      staffHoursMap[t.stage] = staffHoursMap[t.stage] || [];
      if (!staffHoursMap[t.stage].includes(name)) staffHoursMap[t.stage].push(name);
    }
  });

  const assignMap: Record<string, string> = {};
  assignments.forEach((a: any) => { assignMap[a.stage] = (a.profiles as any)?.full_name || ""; });

  const filesMap: Record<string, number> = {};
  files.forEach((f: any) => { filesMap[f.stage] = (filesMap[f.stage] || 0) + 1; });

  const rows: string[][] = [
    ["Project Timeline Report — Nabhangan Engineers"],
    [],
    ["Project", project.bank_name],
    ["Address", project.project_address],
    ["Created At", fmtDate(project.created_at)],
    ["Current Status", project.status],
    [],
    ["Stage", "Assigned Staff", "Hours Logged", "Hours By", "Submitted At", "Status", "Files Uploaded"],
    ...PROJECT_STAGES.map((stage) => {
      const sub = subMap[stage.value];
      const submitted = sub && !sub.revoked_by;
      const revoked = sub && !!sub.revoked_by;
      return [
        stage.label,
        assignMap[stage.value] || "—",
        hoursMap[stage.value] ? `${hoursMap[stage.value].toFixed(1)}h` : "—",
        staffHoursMap[stage.value]?.join("; ") || "—",
        sub?.submitted_at ? fmtDate(sub.submitted_at) : "—",
        submitted ? "Submitted" : revoked ? "Revoked" : "Pending",
        String(filesMap[stage.value] || 0),
      ];
    }),
    [],
    ["Total Hours", `${Object.values(hoursMap).reduce((a, b) => a + b, 0).toFixed(1)}h`],
    ["Report Generated", fmtDate(new Date().toISOString())],
  ];

  const csv = rows.map((row) => row.map(esc).join(",")).join("\r\n");
  const safeName = project.bank_name.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
  const filename = `timeline_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
