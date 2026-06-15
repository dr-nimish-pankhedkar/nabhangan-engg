/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS, UserRole, STATUS_COLORS, ProjectStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

function getWeekBounds(weekOffset = 0): { start: Date; end: Date; label: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = (day === 0 ? -6 : 1 - day) + weekOffset * 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return {
    start: monday,
    end: sunday,
    label: `${fmt(monday)} – ${fmt(sunday)}, ${monday.getFullYear()}`,
  };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ staff_id?: string; week?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const params = await searchParams;
  const weekOffset = parseInt(params.week || "0", 10);
  const selectedStaffId = params.staff_id || "";

  const { start, end, label: weekLabel } = getWeekBounds(weekOffset);
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  const { data: allStaff } = await supabase
    .from("profiles")
    .select("id, full_name, role, designation, is_active")
    .neq("role", "admin")
    .order("full_name");

  const staffList = allStaff || [];

  let reportData: {
    assignments: any[];
    responses: any[];
    timeLogs: any[];
  } | null = null;

  if (selectedStaffId) {
    const [assignmentsRes, responsesRes, timelogsRes] = await Promise.all([
      supabase
        .from("project_assignments")
        .select("*, projects(id, bank_name, status)")
        .eq("user_id", selectedStaffId)
        .order("assigned_at", { ascending: false }),
      supabase
        .from("checklist_responses")
        .select("*, projects(bank_name), checklist_templates(name)")
        .eq("user_id", selectedStaffId)
        .gte("submitted_at", startISO)
        .lte("submitted_at", endISO)
        .order("submitted_at", { ascending: false }),
      supabase
        .from("time_logs")
        .select("hours_spent, stage, notes, logged_at, projects(bank_name)")
        .eq("user_id", selectedStaffId)
        .gte("logged_at", startISO)
        .lte("logged_at", endISO),
    ]);

    reportData = {
      assignments: assignmentsRes.data || [],
      responses: responsesRes.data || [],
      timeLogs: timelogsRes.data || [],
    };
  }

  const prevWeek = weekOffset - 1;
  const nextWeek = weekOffset + 1;

  function weekUrl(offset: number) {
    const p = new URLSearchParams();
    if (selectedStaffId) p.set("staff_id", selectedStaffId);
    p.set("week", String(offset));
    return `/admin/reports?${p.toString()}`;
  }

  function staffUrl(staffId: string) {
    const p = new URLSearchParams();
    p.set("staff_id", staffId);
    p.set("week", String(weekOffset));
    return `/admin/reports?${p.toString()}`;
  }

  const totalHours = reportData?.timeLogs.reduce((s, t) => s + Number(t.hours_spent), 0) ?? 0;

  // Determine completed vs pending assignments
  const completedStageKeys = new Set(
    (reportData?.responses || []).map((r: any) => `${r.project_id || r.projects?.id}:${r.stage}`)
  );

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Staff Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Staff selector */}
        <div className="md:col-span-1">
          <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Select Staff</p>
          <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {staffList.map((s: any) => (
              <Link key={s.id} href={staffUrl(s.id)}>
                <div className={`px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                  selectedStaffId === s.id
                    ? "bg-[#1e3a5f] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}>
                  <p className="font-medium truncate">{s.full_name}</p>
                  <p className={`text-xs ${selectedStaffId === s.id ? "text-blue-200" : "text-slate-400"}`}>
                    {s.designation || ROLE_LABELS[s.role as UserRole]}
                    {!s.is_active && " (inactive)"}
                  </p>
                </div>
              </Link>
            ))}
            {staffList.length === 0 && (
              <p className="text-sm text-slate-400 px-3 py-2">No staff members found.</p>
            )}
          </div>
        </div>

        {/* Week + report */}
        <div className="md:col-span-2">
          {/* Week navigation */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <Link href={weekUrl(prevWeek)}>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
            </Link>
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Calendar className="h-4 w-4 text-slate-400" />
              {weekLabel}
              {weekOffset === 0 && <span className="text-xs text-[#1e3a5f] bg-blue-50 px-1.5 py-0.5 rounded font-medium">This week</span>}
            </div>
            <Link href={weekUrl(nextWeek)}>
              <button className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                weekOffset >= 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-100"
              }`} disabled={weekOffset >= 0}>
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {!selectedStaffId ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              Select a staff member to view their report.
            </div>
          ) : !reportData ? null : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Card className="border-slate-200">
                  <CardContent className="pt-3 pb-3">
                    <p className="text-2xl font-bold text-[#1e3a5f]">{reportData.assignments.length}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Total Allotted</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="pt-3 pb-3">
                    <p className="text-2xl font-bold text-green-600">{reportData.responses.length}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Completed (this week)</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="pt-3 pb-3">
                    <p className="text-2xl font-bold text-amber-600">{totalHours.toFixed(1)}h</p>
                    <p className="text-xs text-slate-400 mt-0.5">Hours Logged</p>
                  </CardContent>
                </Card>
              </div>

              {/* All assignments table */}
              <Card className="border-slate-200 mb-4">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm text-slate-700">All Allotted Tasks</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  {reportData.assignments.length === 0 ? (
                    <p className="text-xs text-slate-400">No tasks allotted.</p>
                  ) : (
                    <div className="space-y-2">
                      {reportData.assignments.map((a: any) => {
                        const key = `${a.project_id}:${a.stage}`;
                        const completed = completedStageKeys.has(key);
                        const isActive = a.projects?.status === a.stage;
                        return (
                          <Link key={a.id} href={`/projects/${a.project_id}`}>
                            <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{a.projects?.bank_name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Stage: <span className="font-medium">{a.stage.charAt(0).toUpperCase() + a.stage.slice(1)}</span>
                                  {isActive && <span className="ml-2 text-[#1e3a5f]">· Active now</span>}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {completed ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 rounded px-2 py-0.5">
                                    <CheckCircle className="h-3 w-3" /> Completed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 rounded px-2 py-0.5">
                                    <Clock className="h-3 w-3" /> Pending
                                  </span>
                                )}
                                <Badge className={STATUS_COLORS[a.projects?.status as ProjectStatus]}>
                                  {a.projects?.status}
                                </Badge>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Checklists submitted this week */}
              {reportData.responses.length > 0 && (
                <Card className="border-slate-200">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm text-slate-700">Checklists Submitted This Week</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-2">
                    {reportData.responses.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-green-50 border border-green-100">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{r.projects?.bank_name}</p>
                          <p className="text-xs text-slate-500">{r.checklist_templates?.name} · {r.stage}</p>
                        </div>
                        <p className="text-xs text-slate-400 shrink-0">
                          {new Date(r.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
