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
import { CheckCircle, ChevronRight, Lightbulb, MapPinned, PenTool, FileText, ShieldCheck, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import StartSurveyButton from "./start-survey-button";

const STAGE_ROUTES: Record<ProjectStatus, string> = {
  lead: "",
  survey: "survey",
  drafting: "drafting",
  report: "report",
  review: "review",
};

const STAGE_ORDER: ProjectStatus[] = ["lead", "survey", "drafting", "report", "review"];

const STAGE_ICONS: Record<ProjectStatus, React.ElementType> = {
  lead: Lightbulb,
  survey: MapPinned,
  drafting: PenTool,
  report: FileText,
  review: ShieldCheck,
};

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
  const progressPct = Math.round((currentStageIdx / (STAGE_ORDER.length - 1)) * 100);
  const isComplete = project.status === "review";

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
      <div className="flex items-center gap-3 mb-6 min-w-0 flex-wrap">
        <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-700 shrink-0">Projects</Link>
        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        <h1 className="text-xl font-semibold text-slate-800 truncate min-w-0">{project.bank_name}</h1>
        <Badge className={cn(STATUS_COLORS[project.status as ProjectStatus], "shrink-0")}>
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

      {/* Lead → Survey kickoff */}
      {project.status === "lead" && profile?.role === "admin" && (
        <StartSurveyButton projectId={id} />
      )}

      {/* Completion banner */}
      {isComplete && (
        <div className="flex items-center gap-3 mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <PartyPopper className="h-5 w-5 text-green-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-700">Project reached final stage — Review</p>
            <p className="text-xs text-green-600/80">All milestones completed. This project is ready for sign-off.</p>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
        <span>Project Progress</span>
        <span className="font-medium text-[#1e3a5f]">{progressPct}% complete</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 mb-8">
        <div
          className={cn("h-2 rounded-full transition-all", isComplete ? "bg-green-500" : "bg-[#1e3a5f]")}
          style={{ width: `${Math.max(progressPct, 6)}%` }}
        />
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {PROJECT_STAGES.map((stage, idx) => {
          const done = idx < currentStageIdx;
          const active = idx === currentStageIdx;
          const route = STAGE_ROUTES[stage.value];
          const href = route ? `/projects/${id}/${route}` : null;
          const StageIcon = STAGE_ICONS[stage.value];
          const isFinalActive = active && stage.value === "review";

          const node = (
            <div className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
              done ? "bg-[#1e3a5f] border-[#1e3a5f]" :
              isFinalActive ? "border-green-500 bg-green-50" :
              active ? "border-[#1e3a5f] bg-white" :
              "border-slate-300 bg-white"
            }`}>
              {done ? (
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              ) : (
                <StageIcon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                  isFinalActive ? "text-green-600" : active ? "text-[#1e3a5f]" : "text-slate-300"
                }`} />
              )}
              {isFinalActive && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
              )}
            </div>
          );

          return (
            <div key={stage.value} className="flex items-center flex-1 last:flex-none min-w-0">
              <div className="flex flex-col items-center min-w-0">
                {href ? <Link href={href}>{node}</Link> : node}
                <span className={`text-[10px] sm:text-xs mt-1 text-center truncate max-w-[60px] sm:max-w-none ${
                  isFinalActive ? "text-green-600 font-medium" : active ? "text-[#1e3a5f] font-medium" : "text-slate-400"
                }`}>
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
