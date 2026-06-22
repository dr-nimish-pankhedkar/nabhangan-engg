/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { STATUS_COLORS, ProjectStatus } from "@/lib/types";
import { FEATURES } from "@/lib/features";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AssignmentForm from "./assignment-form";
import TaskRequestActions from "./task-request-actions";
import RemoveAssignmentButton from "./remove-assignment-button";
import GenerateLinkForm from "./generate-link-form";
import OtherAssignmentForm from "./other-assignment-form";
import CaseInfoPopover from "./case-info-popover";
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

  const admin = await createAdminClient();
  const [projectsRes, staffRes, assignmentsRes, requestsRes, tpTokensRes, otherRes, surveySubmissionsRes] = await Promise.all([
    supabase.from("projects").select("id, bank_name, bank_metadata, project_address, status").neq("status", "dispatch").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, role, designation").eq("is_active", true).order("full_name"),
    supabase.from("project_assignments").select("id, project_id, user_id, stage").order("assigned_at", { ascending: false }),
    supabase.from("task_requests").select("*, profiles(full_name), projects(bank_name)").eq("status", "pending").order("created_at", { ascending: false }),
    admin.from("third_party_tokens").select("project_id, surveyor_name").is("used_at", null).gt("expires_at", new Date().toISOString()),
    supabase.from("other_assignments").select("id, user_id, task_description, assigned_at, profiles(full_name)").eq("is_active", true).order("assigned_at", { ascending: false }),
    // Projects with a non-revoked survey submission (staff-submitted) — these can't get new TP links
    supabase.from("stage_submissions").select("project_id").eq("stage", "survey").is("revoked_by", null),
  ]);

  const projects = projectsRes.data || [];
  const staff = staffRes.data || [];
  const assignments = assignmentsRes.data || [];
  const pendingRequests = requestsRes.data || [];
  const otherAssignments = (otherRes.data || []) as any[];
  // Project IDs where survey is locked (non-revoked submission exists)
  const surveySubmittedIds = new Set((surveySubmissionsRes.data || []).map((r: any) => r.project_id));

  // Build matrix: matrix[project_id][user_id] = {stage, id}[]
  const matrix: Record<string, Record<string, { stage: string; id: string }[]>> = {};
  assignments.forEach((a: any) => {
    if (!matrix[a.project_id]) matrix[a.project_id] = {};
    if (!matrix[a.project_id][a.user_id]) matrix[a.project_id][a.user_id] = [];
    matrix[a.project_id][a.user_id].push({ stage: a.stage, id: a.id });
  });

  // Build third-party map: tpMap[project_id] = [{surveyor_name}]
  const tpMap: Record<string, { surveyor_name: string }[]> = {};
  (tpTokensRes.data || []).forEach((t: any) => {
    tpMap[t.project_id] = tpMap[t.project_id] || [];
    tpMap[t.project_id].push({ surveyor_name: t.surveyor_name });
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
                    <th key={s.id} className="text-center px-3 py-2.5 font-semibold text-slate-600 border-r border-slate-200 min-w-[120px]">
                      <div className="truncate max-w-[120px] mx-auto" title={s.full_name}>{s.full_name.split(" ")[0]}</div>
                      {s.designation && (
                        <div className="text-[10px] font-normal text-slate-400 truncate max-w-[120px] mx-auto">{s.designation}</div>
                      )}
                    </th>
                  ))}
                  <th className="text-center px-3 py-2.5 font-semibold text-purple-600 border-slate-200 min-w-[140px]">
                    <div>Third Party</div>
                    <div className="text-[10px] font-normal text-purple-400">External surveyor</div>
                  </th>
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
                        <div className="flex items-start gap-1">
                          <Link
                            href={`/projects/${p.id}`}
                            className="hover:text-[#1e3a5f] hover:underline min-w-0"
                            title={[p.bank_name, p.bank_metadata?.branch, p.bank_metadata?.owner_name].filter(Boolean).join(" · ")}
                          >
                            <span className="block truncate max-w-[155px] text-xs leading-snug">
                              {[p.bank_name, p.bank_metadata?.branch, p.bank_metadata?.owner_name].filter(Boolean).join(" · ")}
                            </span>
                          </Link>
                          <CaseInfoPopover info={{
                            branch: p.bank_metadata?.branch,
                            bank_manager_name: p.bank_metadata?.bank_manager_name,
                            bank_manager_mob: p.bank_metadata?.bank_manager_mob,
                            owner_name: p.bank_metadata?.owner_name,
                            owner_mob: p.bank_metadata?.owner_mob,
                            project_address: p.project_address,
                          }} />
                        </div>
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
                          <td key={s.id} className="px-2 py-2 border-r border-slate-100 align-top">
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
                      {/* Third Party cell */}
                      <td className="px-2 py-2 align-top">
                        {(tpMap[p.id] || []).length === 0 ? (
                          <span className="text-slate-200 text-[10px] select-none">—</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {(tpMap[p.id] || []).map((tp, i) => (
                              <Badge key={i} className="text-[10px] px-1.5 py-0 font-medium bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-100">
                                Survey — {tp.surveyor_name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Third-party survey link generator — premium feature */}
      {FEATURES.thirdPartyLinks && (
        <div className="max-w-xl mb-8">
          <h2 className="text-sm font-semibold text-slate-600 mb-1">Generate Third-Party Survey Link</h2>
          <p className="text-xs text-slate-400 mb-3">
            Creates a one-time, time-limited link for an external surveyor to fill the site visit report directly — no account required.
          </p>
          <GenerateLinkForm projects={projects} surveySubmittedIds={[...surveySubmittedIds]} />
        </div>
      )}

      {/* Other task assignments */}
      <div className="max-w-xl mb-8">
        <h2 className="text-sm font-semibold text-slate-600 mb-1">Other Tasks</h2>
        <p className="text-xs text-slate-400 mb-3">Assign a general task to a staff member — not linked to any specific case.</p>
        <OtherAssignmentForm staff={staff} existing={otherAssignments} />
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
