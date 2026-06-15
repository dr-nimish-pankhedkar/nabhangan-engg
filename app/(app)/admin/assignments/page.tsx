/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATUS_COLORS, ProjectStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AssignmentForm from "./assignment-form";
import TaskRequestActions from "./task-request-actions";
import RemoveAssignmentButton from "./remove-assignment-button";
import { cn } from "@/lib/utils";

const STAGE_SHORT: Record<string, string> = {
  lead: "Lead",
  survey: "Survey",
  rate_verification: "Rate Verif.",
  drafting: "Drafting",
  checking: "Checking",
  print: "Print",
  scan: "Scan",
  dispatch: "Dispatch",
};

export default async function AssignmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const [projectsRes, staffRes, assignmentsRes, requestsRes] = await Promise.all([
    supabase.from("projects").select("id, bank_name, status").neq("status", "dispatch").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, role, designation").eq("is_active", true).order("full_name"),
    supabase.from("project_assignments").select("id, project_id, user_id, stage").order("assigned_at", { ascending: false }),
    supabase.from("task_requests").select("*, profiles(full_name), projects(bank_name)").eq("status", "pending").order("created_at", { ascending: false }),
  ]);

  const projects = projectsRes.data || [];
  const staff = staffRes.data || [];
  const assignments = assignmentsRes.data || [];
  const pendingRequests = requestsRes.data || [];

  // Build matrix: matrix[project_id][user_id] = {stage, id}[]
  const matrix: Record<string, Record<string, { stage: string; id: string }[]>> = {};
  assignments.forEach((a: any) => {
    if (!matrix[a.project_id]) matrix[a.project_id] = {};
    if (!matrix[a.project_id][a.user_id]) matrix[a.project_id][a.user_id] = [];
    matrix[a.project_id][a.user_id].push({ stage: a.stage, id: a.id });
  });

  // Only show staff who appear in at least one column OR all active staff (to show availability)
  // Show all active staff as columns

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Assignments</h1>

      {/* Assign form — constrained width */}
      <div className="max-w-xl mb-8">
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Assign Staff</h2>
        <AssignmentForm projects={projects} staff={staff} />
      </div>

      {/* Matrix table */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-600 mb-3">
          Assignment Matrix
          <span className="ml-2 text-xs font-normal text-slate-400">Active cases only · closed (dispatched) cases hidden</span>
        </h2>

        {projects.length === 0 ? (
          <p className="text-sm text-slate-500">No active cases.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {/* Sticky project column */}
                  <th className="sticky left-0 z-10 bg-slate-50 text-left px-3 py-2.5 font-semibold text-slate-600 border-r border-slate-200 min-w-[180px] whitespace-nowrap">
                    Project
                  </th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-600 border-r border-slate-200 whitespace-nowrap">
                    Status
                  </th>
                  {staff.map((s: any) => (
                    <th key={s.id} className="text-center px-3 py-2.5 font-semibold text-slate-600 border-r border-slate-200 last:border-r-0 min-w-[120px]">
                      <div className="truncate max-w-[120px] mx-auto" title={s.full_name}>{s.full_name.split(" ")[0]}</div>
                      {s.designation && (
                        <div className="text-[10px] font-normal text-slate-400 truncate max-w-[120px] mx-auto">{s.designation}</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((p: any, idx: number) => {
                  const rowAssignments = matrix[p.id] || {};
                  const hasAny = Object.keys(rowAssignments).length > 0;
                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        "border-b border-slate-100 last:border-b-0 transition-colors",
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/50",
                        "hover:bg-blue-50/30"
                      )}
                    >
                      {/* Sticky project name */}
                      <td className={cn(
                        "sticky left-0 z-10 px-3 py-2.5 border-r border-slate-200 font-medium text-slate-800",
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      )}>
                        <Link href={`/projects/${p.id}`} className="hover:text-[#1e3a5f] hover:underline truncate block max-w-[170px]" title={p.bank_name}>
                          {p.bank_name}
                        </Link>
                        {!hasAny && (
                          <span className="text-[10px] text-slate-300 font-normal">no assignments</span>
                        )}
                      </td>
                      {/* Status */}
                      <td className="px-3 py-2.5 border-r border-slate-200 whitespace-nowrap">
                        <Badge className={cn(STATUS_COLORS[p.status as ProjectStatus], "text-[10px] px-1.5 py-0")}>
                          {STAGE_SHORT[p.status] || p.status}
                        </Badge>
                      </td>
                      {/* One cell per staff member */}
                      {staff.map((s: any) => {
                        const cellItems = rowAssignments[s.id] || [];
                        return (
                          <td key={s.id} className="px-2 py-2 border-r border-slate-100 last:border-r-0 align-top">
                            {cellItems.length === 0 ? (
                              <span className="text-slate-200 text-[10px] select-none">—</span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {cellItems.map((item) => (
                                  <div key={item.id} className="flex items-center gap-0.5">
                                    <Badge className={cn(STATUS_COLORS[item.stage as ProjectStatus], "text-[10px] px-1.5 py-0 font-medium")}>
                                      {STAGE_SHORT[item.stage] || item.stage}
                                    </Badge>
                                    <RemoveAssignmentButton assignmentId={item.id} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending task requests */}
      {pendingRequests.length > 0 && (
        <div className="max-w-xl">
          <h2 className="text-sm font-semibold text-slate-600 mb-3">
            Pending Task Requests ({pendingRequests.length})
          </h2>
          <div className="space-y-2">
            {pendingRequests.map((r: any) => (
              <Card key={r.id} className="border-amber-200 bg-amber-50">
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{r.profiles?.full_name}</p>
                      {r.projects && <p className="text-xs text-slate-500">{r.projects.bank_name}</p>}
                      {r.stage && <Badge className={`text-xs mt-1 ${STATUS_COLORS[r.stage as ProjectStatus]}`}>{r.stage}</Badge>}
                      <p className="text-xs text-slate-600 mt-1">{r.message}</p>
                    </div>
                    <TaskRequestActions requestId={r.id} adminId={user.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
