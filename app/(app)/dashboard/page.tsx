/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { PROJECT_STAGES, ProjectStatus, STATUS_COLORS, ROLE_LABELS, UserRole } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  if (profile.role === "admin") {
    const [projectsRes, staffRes, assignmentsRes] = await Promise.all([
      supabase.from("projects").select("id, bank_name, status"),
      supabase.from("profiles").select("id, full_name, role, designation, is_active").eq("is_active", true).order("full_name"),
      supabase
        .from("project_assignments")
        .select("user_id, stage, projects(bank_name, status)")
        .neq("stage", "lead")
        .neq("stage", "review"),
    ]);

    const projects = projectsRes.data || [];
    const staff = staffRes.data || [];
    const allAssignments = assignmentsRes.data || [];

    const projectsByStage = PROJECT_STAGES.reduce((acc, s) => {
      acc[s.value] = projects.filter((p: any) => p.status === s.value);
      return acc;
    }, {} as Record<ProjectStatus, any[]>);

    const counts = PROJECT_STAGES.reduce((acc, s) => {
      acc[s.value] = projectsByStage[s.value].length;
      return acc;
    }, {} as Record<ProjectStatus, number>);

    const total = projects.length;

    // Active occupancy: assignments whose project is currently in that exact stage (i.e. an open task)
    const activeAssignmentsByUser = allAssignments.reduce((acc: Record<string, any[]>, a: any) => {
      if (a.projects?.status === a.stage) {
        acc[a.user_id] = acc[a.user_id] || [];
        acc[a.user_id].push(a);
      }
      return acc;
    }, {});

    const maxLoad = Math.max(1, ...staff.map((s) => (activeAssignmentsByUser[s.id] || []).length));

    const loadBuckets = { free: 0, light: 0, moderate: 0, heavy: 0 };
    staff.forEach((s) => {
      const load = (activeAssignmentsByUser[s.id] || []).length;
      if (load === 0) loadBuckets.free++;
      else if (load <= 1) loadBuckets.light++;
      else if (load <= 2) loadBuckets.moderate++;
      else loadBuckets.heavy++;
    });

    return (
      <div>
        <h1 className="text-xl font-semibold text-slate-800 mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {PROJECT_STAGES.map((stage) => (
            <Card key={stage.value} className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500 font-medium">{stage.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl sm:text-3xl font-bold text-[#1e3a5f]">{counts[stage.value]}</p>
                <p className="text-xs text-slate-400 mt-1">projects</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-slate-200 mb-8">
          <CardHeader>
            <CardTitle className="text-sm text-slate-600">Stage Distribution</CardTitle>
            <p className="text-xs text-slate-400">Click a stage to see which projects are in it</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {PROJECT_STAGES.map((stage) => {
                const pct = total > 0 ? Math.round((counts[stage.value] / total) * 100) : 0;
                const stageProjects = projectsByStage[stage.value];
                return (
                  <details key={stage.value} className="group">
                    <summary className="flex items-center gap-3 cursor-pointer list-none py-1.5 px-1 -mx-1 rounded-md hover:bg-slate-50 transition-colors [&::-webkit-details-marker]:hidden">
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-open:rotate-90 shrink-0" />
                      <span className="text-xs text-slate-500 w-16 shrink-0">{stage.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-[#1e3a5f] h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right shrink-0">{counts[stage.value]}</span>
                    </summary>
                    <div className="pl-[88px] pr-9 pt-1.5 pb-2">
                      {stageProjects.length === 0 ? (
                        <p className="text-xs text-slate-400">No projects in this stage.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {stageProjects.map((p: any) => (
                            <Link key={p.id} href={`/projects/${p.id}`}>
                              <Badge variant="outline" className="text-xs font-normal text-slate-600 hover:border-[#1e3a5f] hover:text-[#1e3a5f] cursor-pointer transition-colors">
                                {p.bank_name}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Staff Occupancy */}
        <Card className="border-slate-200">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm text-slate-600">Staff Occupancy</CardTitle>
            <Link href="/admin/staff" className="text-xs text-[#1e3a5f] hover:underline flex items-center gap-0.5">
              Manage staff <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {staff.length === 0 ? (
              <p className="text-sm text-slate-500">No active staff members.</p>
            ) : (
              <>
                {/* Legend / summary */}
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-slate-300" /> {loadBuckets.free} Free
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                    <span className="w-2 h-2 rounded-full bg-green-500" /> {loadBuckets.light} Light
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> {loadBuckets.moderate} Moderate
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> {loadBuckets.heavy} Heavy
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {staff.map((s: any) => {
                    const active = activeAssignmentsByUser[s.id] || [];
                    const load = active.length;
                    const pct = Math.round((load / maxLoad) * 100);
                    const ringColor =
                      load === 0 ? "text-slate-300" :
                      load <= 1 ? "text-green-500" :
                      load <= 2 ? "text-amber-500" :
                      "text-red-500";
                    const loadLabel =
                      load === 0 ? "Free" :
                      load <= 1 ? "Light" :
                      load <= 2 ? "Moderate" :
                      "Heavy";
                    const loadBadgeColor =
                      load === 0 ? "bg-slate-100 text-slate-500" :
                      load <= 1 ? "bg-green-100 text-green-700" :
                      load <= 2 ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700";

                    const radius = 18;
                    const circumference = 2 * Math.PI * radius;
                    const dash = (Math.max(pct, load > 0 ? 10 : 0) / 100) * circumference;

                    return (
                      <div key={s.id} className="rounded-lg border border-slate-200 p-3 flex items-start gap-3">
                        <div className="relative shrink-0 w-12 h-12">
                          <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
                            <circle cx="24" cy="24" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100" />
                            <circle
                              cx="24" cy="24" r={radius} fill="none" stroke="currentColor" strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray={`${dash} ${circumference}`}
                              className={cn("transition-all", ringColor)}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-700">{load}</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-sm font-medium text-slate-800 leading-tight truncate">{s.full_name}</p>
                            <Badge className={cn(loadBadgeColor, "shrink-0")}>{loadLabel}</Badge>
                          </div>
                          <p className="text-xs text-slate-400 leading-tight truncate mt-0.5">{s.designation || ROLE_LABELS[s.role as UserRole]}</p>
                          {active.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {active.map((a: any, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs font-normal text-slate-500">
                                  {a.projects?.bank_name} · {a.stage}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-300 mt-2">No active tasks</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Staff dashboard
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [assignmentsRes, timelogsRes, attendanceRes, requestsRes] = await Promise.all([
    supabase.from("project_assignments").select("*, projects(id, bank_name, project_address, status)").eq("user_id", user.id).order("assigned_at", { ascending: false }),
    supabase.from("time_logs").select("hours_spent").eq("user_id", user.id),
    supabase.from("attendance").select("status").eq("user_id", user.id).gte("date", `${currentMonth}-01`),
    supabase.from("task_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const assignments = assignmentsRes.data || [];
  const totalHours = (timelogsRes.data || []).reduce((s: number, t: any) => s + Number(t.hours_spent), 0);
  const presentDays = (attendanceRes.data || []).filter((a: any) => a.status === "present" || a.status === "half_day").length;
  const pendingRequests = (requestsRes.data || []).filter((r: any) => r.status === "pending").length;
  const requests = requestsRes.data || [];

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Dashboard</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">{assignments.length}</p>
            <p className="text-xs text-slate-400 mt-1">Assignments</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">{totalHours.toFixed(1)}h</p>
            <p className="text-xs text-slate-400 mt-1">Hours Logged</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">{presentDays}</p>
            <p className="text-xs text-slate-400 mt-1">Days Present (this month)</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">{pendingRequests}</p>
            <p className="text-xs text-slate-400 mt-1">Pending Requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Active assignments */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-600">Active Assignments</h2>
          <Link href="/my-tasks" className="text-xs text-[#1e3a5f] hover:underline flex items-center gap-0.5">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {assignments.length === 0 ? (
          <p className="text-slate-500 text-sm">No active assignments.</p>
        ) : (
          <div className="space-y-2">
            {assignments.slice(0, 5).map((a: any) => {
              const routes: Record<string, string> = { survey: "survey", drafting: "drafting", report: "report", review: "review" };
              const route = routes[a.stage];
              return (
                <Link key={a.id} href={route ? `/projects/${a.projects?.id}/${route}` : `/projects/${a.projects?.id}`}>
                  <Card className="border-slate-200 hover:shadow-sm transition-shadow cursor-pointer">
                    <CardContent className="py-3">
                      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate">{a.projects?.bank_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{a.projects?.project_address}</p>
                        </div>
                        <Badge className={STATUS_COLORS[a.stage as ProjectStatus]}>
                          {a.stage.charAt(0).toUpperCase() + a.stage.slice(1)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent task requests */}
      {requests.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Recent Task Requests</h2>
          <div className="space-y-2">
            {requests.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded-md px-4 py-3 text-sm">
                <p className="text-slate-700 text-xs">{r.message}</p>
                <Badge className={
                  r.status === "approved" ? "bg-green-100 text-green-700" :
                  r.status === "rejected" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                }>
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
