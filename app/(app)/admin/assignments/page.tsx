/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STAGES, STATUS_COLORS, ProjectStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AssignmentForm from "./assignment-form";
import TaskRequestActions from "./task-request-actions";

export default async function AssignmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const [projectsRes, staffRes, assignmentsRes, requestsRes] = await Promise.all([
    supabase.from("projects").select("id, bank_name, status").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, role").eq("is_active", true).order("full_name"),
    supabase.from("project_assignments").select("*, profiles(full_name)").order("assigned_at", { ascending: false }),
    supabase.from("task_requests").select("*, profiles(full_name), projects(bank_name)").eq("status", "pending").order("created_at", { ascending: false }),
  ]);

  const projects = projectsRes.data || [];
  const staff = staffRes.data || [];
  const assignments = assignmentsRes.data || [];
  const pendingRequests = requestsRes.data || [];

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Assignments</h1>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Assign Staff</h2>
        <AssignmentForm projects={projects} staff={staff} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Current Assignments</h2>
        {assignments.length === 0 ? (
          <p className="text-sm text-slate-500">No assignments yet.</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between gap-2 flex-wrap bg-slate-50 rounded-md px-4 py-3 text-sm">
                <span className="text-slate-800 font-medium truncate min-w-0">{a.profiles?.full_name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={STATUS_COLORS[a.stage as ProjectStatus]}>{a.stage}</Badge>
                  <span className="text-slate-400 text-xs whitespace-nowrap">project: {a.project_id.slice(0, 8)}…</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingRequests.length > 0 && (
        <div className="mt-8">
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
