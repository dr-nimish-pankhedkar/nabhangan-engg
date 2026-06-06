/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STAGES, ProjectStatus, STATUS_COLORS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, ChevronRight } from "lucide-react";

const STAGE_ROUTES: Record<ProjectStatus, string> = {
  lead: "",
  survey: "survey",
  drafting: "drafting",
  report: "report",
  review: "review",
};

const STAGE_ORDER: ProjectStatus[] = ["lead", "survey", "drafting", "report", "review"];

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  const { id } = await params;

  const { data: project } = await supabase
    .from("projects")
    .select("*, profiles(full_name)")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const currentStageIdx = STAGE_ORDER.indexOf(project.status);

  // Fetch history for all stages
  const [filesRes, responsesRes, timelogsRes] = await Promise.all([
    supabase.from("project_files").select("*, profiles(full_name)").eq("project_id", id).order("uploaded_at", { ascending: false }),
    supabase.from("checklist_responses").select("*, profiles(full_name), checklist_templates(name)").eq("project_id", id).order("submitted_at", { ascending: false }),
    supabase.from("time_logs").select("*, profiles(full_name)").eq("project_id", id).order("logged_at", { ascending: false }),
  ]);

  const files = filesRes.data || [];
  const responses = responsesRes.data || [];
  const timelogs = timelogsRes.data || [];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-700">Projects</Link>
        <ChevronRight className="h-4 w-4 text-slate-400" />
        <h1 className="text-xl font-semibold text-slate-800">{project.bank_name}</h1>
        <Badge className={STATUS_COLORS[project.status as ProjectStatus]}>
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </Badge>
      </div>

      <Card className="border-slate-200 mb-6">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-slate-500">{project.project_address}</p>
          {profile?.role === "admin" && (
            <p className="text-xs text-slate-400 mt-1">Created by: {(project as any).profiles?.full_name}</p>
          )}
        </CardContent>
      </Card>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {PROJECT_STAGES.map((stage, idx) => {
          const done = idx < currentStageIdx;
          const active = idx === currentStageIdx;
          const route = STAGE_ROUTES[stage.value];
          const href = route ? `/projects/${id}/${route}` : null;

          return (
            <div key={stage.value} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                {href ? (
                  <Link href={href}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                      done ? "bg-[#1e3a5f] border-[#1e3a5f]" :
                      active ? "border-[#1e3a5f] bg-white" :
                      "border-slate-300 bg-white"
                    }`}>
                      {done ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <Circle className={`h-4 w-4 ${active ? "text-[#1e3a5f]" : "text-slate-300"}`} />
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    done ? "bg-[#1e3a5f] border-[#1e3a5f]" :
                    active ? "border-[#1e3a5f] bg-white" :
                    "border-slate-300 bg-white"
                  }`}>
                    {done ? (
                      <CheckCircle className="h-4 w-4 text-white" />
                    ) : (
                      <Circle className={`h-4 w-4 ${active ? "text-[#1e3a5f]" : "text-slate-300"}`} />
                    )}
                  </div>
                )}
                <span className={`text-xs mt-1 ${active ? "text-[#1e3a5f] font-medium" : "text-slate-400"}`}>
                  {stage.label}
                </span>
              </div>
              {idx < PROJECT_STAGES.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${idx < currentStageIdx ? "bg-[#1e3a5f]" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Stage history */}
      <h2 className="text-sm font-semibold text-slate-600 mb-3">Activity History</h2>
      <div className="space-y-4">
        {PROJECT_STAGES.map((stage) => {
          const stageFiles = files.filter((f: any) => f.stage === stage.value);
          const stageResponses = responses.filter((r: any) => r.stage === stage.value);
          const stageTimelogs = timelogs.filter((t: any) => t.stage === stage.value);
          const hasContent = stageFiles.length > 0 || stageResponses.length > 0 || stageTimelogs.length > 0;

          return (
            <Card key={stage.value} className="border-slate-200">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge className={STATUS_COLORS[stage.value]}>{stage.label}</Badge>
                  {!hasContent && <span className="text-xs text-slate-400 font-normal">No activity yet</span>}
                </CardTitle>
              </CardHeader>
              {hasContent && (
                <CardContent className="px-4 pb-4 pt-0 space-y-2">
                  {stageFiles.map((f: any) => (
                    <div key={f.id} className="text-xs text-slate-600 bg-slate-50 rounded px-3 py-2">
                      <span className="font-medium">File:</span> {f.file_name}
                      {f.remarks && <span className="text-slate-400 ml-2">— {f.remarks}</span>}
                      <span className="text-slate-400 ml-2">by {f.profiles?.full_name}</span>
                    </div>
                  ))}
                  {stageResponses.map((r: any) => (
                    <div key={r.id} className="text-xs text-slate-600 bg-slate-50 rounded px-3 py-2">
                      <span className="font-medium">Checklist:</span> {r.checklist_templates?.name}
                      {r.remarks && <span className="text-slate-400 ml-2">— {r.remarks}</span>}
                      <span className="text-slate-400 ml-2">by {r.profiles?.full_name}</span>
                    </div>
                  ))}
                  {stageTimelogs.map((t: any) => (
                    <div key={t.id} className="text-xs text-slate-600 bg-slate-50 rounded px-3 py-2">
                      <span className="font-medium">Time:</span> {t.hours_spent}h
                      {t.notes && <span className="text-slate-400 ml-2">— {t.notes}</span>}
                      <span className="text-slate-400 ml-2">by {t.profiles?.full_name}</span>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
