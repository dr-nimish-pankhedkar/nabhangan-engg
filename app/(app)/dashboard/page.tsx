/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
      supabase.from("projects").select("status"),
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

    const counts = PROJECT_STAGES.reduce((acc, s) => {
      acc[s.value] = projects.filter((p) => p.status === s.value).length;
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
                <p className="text-3xl font-bold text-[#1e3a5f]">{counts[stage.value]}</p>
                <p className="text-xs text-slate-400 mt-1">projects</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-slate-200 mb-8">
          <CardHeader>
            <CardTitle className="text-sm text-slate-600">Stage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PROJECT_STAGES.map((stage) => {
                const pct = total > 0 ? Math.round((counts[stage.value] / total) * 100) : 0;
                return (
                  <div key={stage.value} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-16">{stage.label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-[#1e3a5f] h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{counts[stage.value]}</span>
                  </div>
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
              <div className="space-y-4">
                {staff.map((s: any) => {
                  const active = activeAssignmentsByUser[s.id] || [];
                  const load = active.length;
                  const pct = Math.round((load / maxLoad) * 100);
                  const barColor =
                    load === 0 ? "bg-slate-200" :
                    load <= 1 ? "bg-green-500" :
                    load <= 2 ? "bg-amber-500" :
                    "bg-red-500";
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

                  return (
                    <div key={s.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {s.full_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800 leading-tight">{s.full_name}</p>
                            <p className="text-xs text-slate-400 leading-tight">{s.designation || ROLE_LABELS[s.role as UserRole]}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={loadBadgeColor}>{loadLabel}</Badge>
                          <span className="text-xs text-slate-400 w-16 text-right">{load} active task{load === 1 ? "" : "s"}</span>
                        </div>
                      </div>
                      <div className="flex-1 bg-slate-100 rounded-full h-2 ml-9">
                        <div
                          className={`h-2 rounded-full transition-all ${barColor}`}
                          style={{ width: `${Math.max(pct, load > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                      {active.length > 0 && (
                        <div className="ml-9 mt-1.5 flex flex-wrap gap-1.5">
                          {active.map((a: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs font-normal text-slate-500">
                              {a.projects?.bank_name} · {a.stage}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
            <p className="text-2xl font-bold text-[#1e3a5f]">{assignments.length}</p>
            <p className="text-xs text-slate-400 mt-1">Assignments</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-[#1e3a5f]">{totalHours.toFixed(1)}h</p>
            <p className="text-xs text-slate-400 mt-1">Hours Logged</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-[#1e3a5f]">{presentDays}</p>
            <p className="text-xs text-slate-400 mt-1">Days Present (this month)</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-[#1e3a5f]">{pendingRequests}</p>
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
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800">{a.projects?.bank_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{a.projects?.project_address}</p>
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
