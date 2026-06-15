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
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronRight, Lightbulb, MapPinned, PenTool, Calculator, ClipboardCheck, Printer, ScanLine, Send, PartyPopper, AlertTriangle, Pencil, LockKeyhole, RotateCcw, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import StartSurveyButton from "./start-survey-button";
import AdvanceStageButton from "./advance-stage-button";
import DocumentsPendingToggle from "./documents-pending-toggle";
import ApproveCaseButton from "./approve-case-button";
import RevokeStageButton from "./revoke-stage-button";
import FileManager from "./file-manager";

const STAGE_ROUTES: Record<ProjectStatus, string> = {
  lead: "",
  survey: "survey",
  rate_verification: "rate-verification",
  drafting: "drafting",
  checking: "checking",
  print: "print",
  scan: "scan",
  dispatch: "dispatch",
};

const STAGE_ORDER: ProjectStatus[] = ["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch"];

const STAGE_ICONS: Record<ProjectStatus, React.ElementType> = {
  lead: Lightbulb,
  survey: MapPinned,
  rate_verification: Calculator,
  drafting: PenTool,
  checking: ClipboardCheck,
  print: Printer,
  scan: ScanLine,
  dispatch: Send,
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

  const isAdmin = profile?.role === "admin";
  const currentStageIdx = STAGE_ORDER.indexOf(project.status);
  const progressPct = Math.round((currentStageIdx / (STAGE_ORDER.length - 1)) * 100);
  const isComplete = project.status === "dispatch";

  const [filesRes, responsesRes, timelogsRes, assignmentsRes, submissionsRes] = await Promise.all([
    supabase.from("project_files").select("*, profiles(full_name)").eq("project_id", id).order("uploaded_at", { ascending: false }),
    supabase.from("checklist_responses").select("*, profiles(full_name), checklist_templates(name)").eq("project_id", id).order("submitted_at", { ascending: false }),
    supabase.from("time_logs").select("*, profiles(full_name)").eq("project_id", id).order("logged_at", { ascending: false }),
    supabase.from("project_assignments").select("*, profiles(full_name, role)").eq("project_id", id),
    supabase.from("stage_submissions").select("stage, submitted_at, submitted_by, revoked_by").eq("project_id", id),
  ]);

  const rawFiles = filesRes.data || [];
  const files = await Promise.all(
    rawFiles.map(async (f: any) => {
      const { data } = await supabase.storage.from("project-files").createSignedUrl(f.file_path, 3600);
      return { ...f, signedUrl: data?.signedUrl || null };
    })
  );
  const responses = responsesRes.data || [];
  const timelogs = timelogsRes.data || [];
  const assignments = assignmentsRes.data || [];
  const submissions = submissionsRes.data || [];
  const submissionsMap: Record<string, any> = {};
  submissions.forEach((s: any) => { submissionsMap[s.stage] = s; });

  const nextStageIdx = currentStageIdx + 1;
  const nextStage = nextStageIdx < STAGE_ORDER.length ? STAGE_ORDER[nextStageIdx] : null;
  const currentStageDone = !isComplete && responses.some((r: any) => r.stage === project.status);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6 min-w-0 flex-wrap">
        <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-700 shrink-0">Cases</Link>
        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        <h1 className="text-xl font-semibold text-slate-800 truncate min-w-0">{project.bank_name}</h1>
        <Badge className={cn(STATUS_COLORS[project.status as ProjectStatus], "shrink-0")}>
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </Badge>
        {project.documents_pending && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 rounded px-2 py-0.5 shrink-0">
            <AlertTriangle className="h-3.5 w-3.5" /> Docs Pending
          </span>
        )}
      </div>

      <Card className="border-slate-200 mb-4">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm text-slate-500">{project.project_address}</p>
              {isAdmin && (
                <p className="text-xs text-slate-400 mt-1">Created by: {(project as any).profiles?.full_name}</p>
              )}
            </div>
            {isAdmin && (
              <Link href={`/projects/${id}/edit`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0">
                  <Pencil className="h-3.5 w-3.5" /> Edit Case
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents Pending toggle — admin only */}
      {isAdmin && (
        <div className="mb-4">
          <DocumentsPendingToggle projectId={id} initialValue={!!project.documents_pending} />
        </div>
      )}

      {/* Documents pending warning for non-admin */}
      {!isAdmin && project.documents_pending && (
        <div className="flex items-center gap-3 mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Documents Pending</p>
            <p className="text-xs text-amber-600">Required documents have not yet been submitted for this case.</p>
          </div>
        </div>
      )}

      {/* Needs admin review banner */}
      {isAdmin && project.requires_review && (
        <ApproveCaseButton projectId={id} />
      )}

      {/* Lead → Survey kickoff */}
      {project.status === "lead" && isAdmin && !project.requires_review && (
        <StartSurveyButton projectId={id} />
      )}

      {/* Stuck-stage recovery */}
      {currentStageDone && nextStage && isAdmin && (
        <AdvanceStageButton
          projectId={id}
          nextStatus={nextStage}
          nextLabel={PROJECT_STAGES.find((s) => s.value === nextStage)?.label || nextStage}
        />
      )}

      {/* Completion banner */}
      {isComplete && (
        <div className="flex items-center gap-3 mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <PartyPopper className="h-5 w-5 text-green-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-700">Case Dispatched — Complete</p>
            <p className="text-xs text-green-600/80">All stages completed. This case has been dispatched.</p>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
        <span>Case Progress</span>
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
          const isFinalActive = active && stage.value === "dispatch";

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
          const stageAssignees = assignments.filter((a: any) => a.stage === stage.value);
          const hasContent = stageFiles.length > 0 || stageResponses.length > 0 || stageTimelogs.length > 0;

          return (
            <Card key={stage.value} className="border-slate-200">
              <CardHeader className="py-3 px-4">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
                    <Badge className={STATUS_COLORS[stage.value]}>{stage.label}</Badge>
                    {stageAssignees.length > 0 ? (
                      <span className="text-xs text-slate-500 font-normal flex items-center gap-1 flex-wrap">
                        Assigned to:
                        {stageAssignees.map((a: any) => (
                          <Badge key={a.id} variant="outline" className="text-xs font-normal text-[#1e3a5f] border-[#1e3a5f]/30">
                            {a.profiles?.full_name}
                          </Badge>
                        ))}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-normal">No one assigned yet</span>
                    )}
                    {!hasContent && <span className="text-xs text-slate-400 font-normal">· No activity yet</span>}
                  </CardTitle>
                  {isAdmin && submissionsMap[stage.value] && (
                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      {!submissionsMap[stage.value].revoked_by ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                            <LockKeyhole className="h-2.5 w-2.5" />
                            Locked
                          </span>
                          <RevokeStageButton projectId={id} stage={stage.value} />
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                          <RotateCcw className="h-2.5 w-2.5" />
                          Revoked — awaiting re-submission
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              {hasContent && (
                <CardContent className="px-4 pb-4 pt-0 space-y-2">
                  {stageFiles.map((f: any) => (
                    <div key={f.id} className="flex items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 rounded px-3 py-2">
                      <div className="min-w-0">
                        <span className="font-medium">File:</span> {f.file_name}
                        {f.remarks && <span className="text-slate-400 ml-2">— {f.remarks}</span>}
                        <span className="text-slate-400 ml-2">by {f.profiles?.full_name}</span>
                      </div>
                      {f.signedUrl && (
                        <a href={f.signedUrl} download={f.file_name} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium text-[#1e3a5f] hover:underline">
                          <Download className="h-3 w-3" />
                          Download
                        </a>
                      )}
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

      {/* File Management — admin only, closed cases only */}
      {isAdmin && isComplete && files.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-600 mb-1">File Management</h2>
          <p className="text-xs text-slate-400 mb-3">Case is closed. Select files to permanently delete from storage.</p>
          <Card className="border-slate-200">
            <CardContent className="pt-4 pb-4">
              <FileManager files={files.map((f: any) => ({ id: f.id, file_name: f.file_name, stage: f.stage, uploaded_at: f.uploaded_at }))} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
