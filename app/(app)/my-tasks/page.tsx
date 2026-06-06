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
import TaskRequestForm from "./task-request-form";

export default async function MyTasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "admin") redirect("/dashboard");

  const [assignmentsRes, requestsRes, projectsRes] = await Promise.all([
    supabase.from("project_assignments").select("*, projects(id, bank_name, project_address, status)").eq("user_id", user.id).order("assigned_at", { ascending: false }),
    supabase.from("task_requests").select("*, projects(bank_name)").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("projects").select("id, bank_name, status").order("created_at", { ascending: false }),
  ]);

  const assignments = assignmentsRes.data || [];
  const requests = requestsRes.data || [];
  const projects = projectsRes.data || [];

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">My Tasks</h1>

      {/* Active assignments */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Active Assignments ({assignments.length})</h2>
        {assignments.length === 0 ? (
          <p className="text-sm text-slate-500">No assignments yet.</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((a: any) => {
              const stage = a.stage as ProjectStatus;
              const routes: Record<string, string> = { survey: "survey", drafting: "drafting", report: "report", review: "review" };
              const route = routes[stage];
              return (
                <Card key={a.id} className="border-slate-200">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{a.projects?.bank_name}</p>
                        <p className="text-xs text-slate-400">{a.projects?.project_address}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={STATUS_COLORS[stage]}>{stage}</Badge>
                        {route && (
                          <Link href={`/projects/${a.projects?.id}/${route}`}>
                            <Badge variant="outline" className="cursor-pointer hover:bg-slate-50 text-xs">Open →</Badge>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Request a task */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Request a Task</h2>
        <TaskRequestForm userId={user.id} projects={projects} />
      </div>

      {/* My requests */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">My Requests</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-slate-500">No requests submitted.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r: any) => (
              <Card key={r.id} className="border-slate-200">
                <CardContent className="py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      {r.projects && <p className="text-sm font-medium text-slate-700">{r.projects.bank_name}</p>}
                      {r.stage && <Badge className={`${STATUS_COLORS[r.stage as ProjectStatus]} mr-2`}>{r.stage}</Badge>}
                      <p className="text-xs text-slate-500 mt-1">{r.message}</p>
                    </div>
                    <Badge className={
                      r.status === "approved" ? "bg-green-100 text-green-700" :
                      r.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }>
                      {r.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
