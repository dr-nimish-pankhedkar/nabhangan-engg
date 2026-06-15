/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STAGES } from "@/lib/types";

const STAGES = PROJECT_STAGES.map((s) => s.value);

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

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [projectsRes, submissionsRes, timeLogsRes, assignmentsRes] = await Promise.all([
    supabase.from("projects").select("id, bank_name, project_address, status, created_at, profiles(full_name)").order("created_at", { ascending: false }),
    supabase.from("stage_submissions").select("project_id, stage, submitted_at, revoked_by"),
    supabase.from("time_logs").select("project_id, stage, hours_spent"),
    supabase.from("project_assignments").select("project_id, stage, profiles(full_name)"),
  ]);

  const projects = projectsRes.data || [];
  const submissions = submissionsRes.data || [];
  const timeLogs = timeLogsRes.data || [];
  const assignments = assignmentsRes.data || [];

  // Build lookup maps
  const subMap: Record<string, Record<string, any>> = {};
  submissions.forEach((s: any) => {
    subMap[s.project_id] = subMap[s.project_id] || {};
    subMap[s.project_id][s.stage] = s;
  });

  const hoursMap: Record<string, Record<string, number>> = {};
  timeLogs.forEach((t: any) => {
    hoursMap[t.project_id] = hoursMap[t.project_id] || {};
    hoursMap[t.project_id][t.stage] = (hoursMap[t.project_id][t.stage] || 0) + Number(t.hours_spent);
  });

  const assignMap: Record<string, Record<string, string>> = {};
  assignments.forEach((a: any) => {
    assignMap[a.project_id] = assignMap[a.project_id] || {};
    assignMap[a.project_id][a.stage] = (a.profiles as any)?.full_name || "";
  });

  // Header row: project fields + per-stage columns
  const stageHeaders = STAGES.flatMap((s) => {
    const label = PROJECT_STAGES.find((ps) => ps.value === s)?.label || s;
    return [`${label} — Staff`, `${label} — Hours`, `${label} — Submitted At`];
  });

  const header = [
    "Project Name", "Address", "Current Status", "Created At", "Created By",
    "Total Hours",
    ...stageHeaders,
  ];

  const dataRows = projects.map((p: any) => {
    const pSubs = subMap[p.id] || {};
    const pHours = hoursMap[p.id] || {};
    const pAssign = assignMap[p.id] || {};
    const totalHours = Object.values(pHours).reduce((a: number, b: number) => a + b, 0);

    const stageCols = STAGES.flatMap((s) => {
      const sub = pSubs[s];
      const submitted = sub && !sub.revoked_by ? fmtDate(sub.submitted_at) : (sub ? "Revoked" : "—");
      return [
        pAssign[s] || "—",
        pHours[s] ? `${(pHours[s]).toFixed(1)}h` : "—",
        submitted,
      ];
    });

    return [
      p.bank_name,
      p.project_address,
      p.status,
      fmtDate(p.created_at),
      (p.profiles as any)?.full_name || "—",
      totalHours > 0 ? `${totalHours.toFixed(1)}h` : "—",
      ...stageCols,
    ];
  });

  const rows = [
    ["All Projects Report — Nabhangan Engineers"],
    [`Generated: ${fmtDate(new Date().toISOString())}`],
    [`Total Projects: ${projects.length}`],
    [],
    header,
    ...dataRows,
  ];

  const csv = rows.map((row) => row.map(esc).join(",")).join("\r\n");
  const filename = `all_projects_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
