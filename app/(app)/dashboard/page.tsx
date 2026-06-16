/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { PROJECT_STAGES, ProjectStatus, STATUS_COLORS, ROLE_LABELS, UserRole } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

function getGreeting() {
  const istHour = new Date(Date.now() + 330 * 60 * 1000).getUTCHours();

  if (istHour >= 5 && istHour < 12) return { salutation: "Good Morning", emoji: "☀️", tagline: "A fresh start — let's move some cases forward today." };
  if (istHour >= 12 && istHour < 17) return { salutation: "Good Afternoon", emoji: "🌤️", tagline: "Keep the momentum going — every step counts." };
  if (istHour >= 17 && istHour < 21) return { salutation: "Good Evening", emoji: "🌆", tagline: "Great work today. Let's wrap up strong." };
  return { salutation: "Good Night", emoji: "🌙", tagline: "Working late? Your dedication makes all the difference." };
}

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

  const firstName = profile.full_name?.split(" ")[0] || "there";
  const { salutation, emoji, tagline } = getGreeting();

  if (profile.role === "admin") {
    const adminClient = await createAdminClient();
    const [projectsRes, staffRes, assignmentsRes, tpTokensRes] = await Promise.all([
      supabase.from("projects").select("id, bank_name, status"),
      supabase.from("profiles").select("id, full_name, role, designation, is_active").eq("is_active", true).order("full_name"),
      supabase
        .from("project_assignments")
        .select("user_id, stage, projects(bank_name, status)")
        .neq("stage", "lead")
        .neq("stage", "dispatch"),
      adminClient
        .from("third_party_tokens")
        .select("surveyor_name, project_id")
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString()),
    ]);

    const projects = projectsRes.data || [];
    const staff = staffRes.data || [];
    const allAssignments = assignmentsRes.data || [];

    // Build project name lookup from already-fetched projects
    const projectNameMap: Record<string, string> = {};
    projects.forEach((p: any) => { projectNameMap[p.id] = p.bank_name; });

    // Group third-party tokens by surveyor_name
    const tpGroupMap: Record<string, { count: number; projects: { id: string; bank_name: string }[] }> = {};
    (tpTokensRes.data || []).forEach((t: any) => {
      if (!tpGroupMap[t.surveyor_name]) tpGroupMap[t.surveyor_name] = { count: 0, projects: [] };
      tpGroupMap[t.surveyor_name].count++;
      tpGroupMap[t.surveyor_name].projects.push({
        id: t.project_id,
        bank_name: projectNameMap[t.project_id] || t.project_id,
      });
    });
    const thirdPartyGroups = Object.entries(tpGroupMap).map(([name, data]) => ({ name, ...data }));

    const projectsByStage = PROJECT_STAGES.reduce((acc, s) => {
      acc[s.value] = projects.filter((p: any) => p.status === s.value);
      return acc;
    }, {} as Record<ProjectStatus, any[]>);

    const counts = PROJECT_STAGES.reduce((acc, s) => {
      acc[s.value] = projectsByStage[s.value].length;
      return acc;
    }, {} as Record<ProjectStatus, number>);

    const total = projects.length;
    const closedCases = counts["dispatch"] || 0;
    const activeCases = total - closedCases;

    const STAGE_ORDER = PROJECT_STAGES.map((s) => s.value);

    // Workload per staff member: any assignment whose stage hasn't been
    // completed yet (the project's current stage is at or before it) — this
    // covers both work-in-progress ("active now") and queued/upcoming tasks,
    // so an assigned-but-not-yet-started task still counts as "occupied".
    const activeAssignmentsByUser = allAssignments.reduce((acc: Record<string, any[]>, a: any) => {
      const status = a.projects?.status;
      if (!status) return acc;
      const stageIdx = STAGE_ORDER.indexOf(a.stage);
      const statusIdx = STAGE_ORDER.indexOf(status);
      if (stageIdx >= statusIdx) {
        acc[a.user_id] = acc[a.user_id] || [];
        acc[a.user_id].push({ ...a, isActive: stageIdx === statusIdx });
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
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-800">{emoji} {salutation}, {firstName}!</h1>
          <p className="text-sm text-slate-400 mt-0.5">{tagline}</p>
        </div>

        {/* Summary header */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏗️</span>
            <div>
              <p className="text-2xl font-bold text-[#1e3a5f] leading-none">{activeCases}</p>
              <p className="text-xs text-slate-500 mt-0.5">Active Cases</p>
            </div>
          </div>
          <div className="w-px bg-slate-200 self-stretch hidden sm:block" />
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-2xl font-bold text-green-600 leading-none">{closedCases}</p>
              <p className="text-xs text-slate-500 mt-0.5">Closed (Dispatched)</p>
            </div>
          </div>
          <div className="w-px bg-slate-200 self-stretch hidden sm:block" />
          <div className="flex items-center gap-3">
            <span className="text-2xl">📁</span>
            <div>
              <p className="text-2xl font-bold text-slate-400 leading-none">{total}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total</p>
            </div>
          </div>
        </div>

        {/* Stage tiles — all 8 stages */}
        {(() => {
          const STAGE_EMOJI: Record<string, string> = {
            lead: "💡",
            survey: "📍",
            rate_verification: "📊",
            drafting: "✏️",
            checking: "🔍",
            print: "🖨️",
            scan: "📷",
            dispatch: "📬",
          };
          const visibleStages = PROJECT_STAGES;
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
              {visibleStages.map((stage) => {
                const isDispatch = stage.value === "dispatch";
                const count = counts[stage.value];
                return (
                  <Card key={stage.value} className={cn(
                    "border transition-colors",
                    isDispatch ? "border-green-200 bg-green-50/60" : "border-slate-200 hover:border-slate-300"
                  )}>
                    <CardContent className="px-3 pb-3 pt-3">
                      <div className="text-lg mb-1 leading-none">{STAGE_EMOJI[stage.value]}</div>
                      <p className="text-[11px] text-slate-500 font-medium leading-tight">{stage.label}</p>
                      <p className={cn("text-2xl font-bold leading-none mt-1.5", isDispatch ? "text-green-600" : "text-[#1e3a5f]")}>
                        {count}
                      </p>
                      <p className={cn("text-[10px] mt-1 font-medium", isDispatch ? "text-green-500" : "text-slate-400")}>
                        {isDispatch ? "completed" : "in progress"}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          );
        })()}

        <Card className="border-slate-200 mb-8">
          <CardHeader>
            <CardTitle className="text-sm text-slate-600">Stage Distribution</CardTitle>
            <p className="text-xs text-slate-400">Click a stage to see which cases are in it · non-dispatch = in progress at that stage · dispatch = completed</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {PROJECT_STAGES.map((stage) => {
                const isDispatch = stage.value === "dispatch";
                const denominator = isDispatch ? total : activeCases;
                const pct = denominator > 0 ? Math.round((counts[stage.value] / denominator) * 100) : 0;
                const stageProjects = projectsByStage[stage.value];
                const barColor = isDispatch ? "bg-green-500" : "bg-[#1e3a5f]";
                return (
                  <details key={stage.value} className="group">
                    <summary className="flex items-center gap-3 cursor-pointer list-none py-1.5 px-1 -mx-1 rounded-md hover:bg-slate-50 transition-colors [&::-webkit-details-marker]:hidden">
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-open:rotate-90 shrink-0" />
                      <span className={`text-xs w-24 shrink-0 ${isDispatch ? "text-green-600 font-medium" : "text-slate-500"}`}>{stage.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div
                          className={`${barColor} h-2 rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs w-12 text-right shrink-0 tabular-nums font-medium ${isDispatch ? "text-green-600" : "text-slate-500"}`}>
                        {counts[stage.value]} {isDispatch ? "done" : "active"}
                      </span>
                    </summary>
                    <div className="pl-[116px] pr-14 pt-1.5 pb-2">
                      {stageProjects.length === 0 ? (
                        <p className="text-xs text-slate-400">No cases in this stage.</p>
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
                <p className="text-xs text-slate-400 mb-2">
                  Counts every assigned task not yet completed — work currently in progress as well as queued/upcoming stages.
                </p>
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
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
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className={cn(
                                    "text-xs font-normal",
                                    a.isActive
                                      ? "text-[#1e3a5f] border-[#1e3a5f]/30 bg-[#1e3a5f]/5"
                                      : "text-slate-400 border-dashed"
                                  )}
                                >
                                  {a.projects?.bank_name} · {a.stage}{!a.isActive && " (queued)"}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-300 mt-2">No tasks assigned</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {thirdPartyGroups.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-slate-500 mb-3 mt-2">Third-Party Surveyors (active links)</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {thirdPartyGroups.map((tp) => (
                        <div key={tp.name} className="rounded-lg border border-purple-100 bg-purple-50/40 p-3 flex items-start gap-3">
                          <div className="relative shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-purple-700">{tp.count}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="text-sm font-medium text-slate-800 leading-tight truncate">{tp.name}</p>
                              <Badge className="shrink-0 bg-purple-100 text-purple-700 hover:bg-purple-100">External</Badge>
                            </div>
                            <p className="text-xs text-purple-400 leading-tight mt-0.5">Third Party Surveyor</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {tp.projects.map((proj) => (
                                <Badge key={proj.id} variant="outline" className="text-xs font-normal text-purple-700 border-purple-200">
                                  {proj.bank_name} · survey
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Staff dashboard
  const currentMonth = new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 7);

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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">{emoji} {salutation}, {firstName}!</h1>
        <p className="text-sm text-slate-400 mt-0.5">{tagline}</p>
      </div>

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
              const routes: Record<string, string> = { survey: "survey", rate_verification: "rate-verification", drafting: "drafting", checking: "checking", print: "print", scan: "scan", dispatch: "dispatch" };
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
