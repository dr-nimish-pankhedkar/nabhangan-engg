/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STAGES, ProjectStatus, STATUS_COLORS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; docs_pending?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const params = await searchParams;
  const activeStage = params.stage as ProjectStatus | undefined;
  const docsFilter = params.docs_pending === "1";

  let query = supabase
    .from("projects")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    const { data: assignedIds } = await supabase
      .from("project_assignments")
      .select("project_id")
      .eq("user_id", user.id);
    const ids = (assignedIds || []).map((a: any) => a.project_id);
    if (ids.length === 0) {
      return (
        <div>
          <h1 className="text-xl font-semibold text-slate-800 mb-6">Cases</h1>
          <p className="text-slate-500 text-sm">No cases assigned to you.</p>
        </div>
      );
    }
    query = query.in("id", ids);
  }

  if (activeStage) {
    query = query.eq("status", activeStage);
  }

  if (docsFilter) {
    query = query.eq("documents_pending", true);
  }

  const { data: projects } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-xl font-semibold text-slate-800">Cases</h1>
        <Link href="/projects/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#162d4a] text-white gap-2">
            <Plus className="h-4 w-4" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Stage filters */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <Link href="/projects">
          <Badge variant={!activeStage && !docsFilter ? "default" : "outline"} className={!activeStage && !docsFilter ? "bg-[#1e3a5f]" : "cursor-pointer"}>
            All
          </Badge>
        </Link>
        {PROJECT_STAGES.map((s) => (
          <Link key={s.value} href={`/projects?stage=${s.value}`}>
            <Badge
              variant={activeStage === s.value ? "default" : "outline"}
              className={activeStage === s.value ? "bg-[#1e3a5f]" : "cursor-pointer"}
            >
              {s.label}
            </Badge>
          </Link>
        ))}
        <Link href="/projects?docs_pending=1">
          <Badge
            variant={docsFilter ? "default" : "outline"}
            className={cn(
              docsFilter ? "bg-amber-600" : "cursor-pointer border-amber-300 text-amber-700 hover:bg-amber-50",
              "gap-1"
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            Docs Pending
          </Badge>
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <p className="text-slate-500 text-sm mt-4">
          {docsFilter ? "No cases with pending documents." : "No cases found."}
        </p>
      ) : (
        <div className="space-y-3 mt-4">
          {projects.map((p: any) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className={cn(
                "border-slate-200 hover:shadow-sm transition-shadow cursor-pointer",
                p.documents_pending && "border-amber-200"
              )}>
                <CardContent className="py-4">
                  <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-800 truncate">{p.bank_name}</p>
                        {p.documents_pending && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 rounded px-1.5 py-0.5 shrink-0">
                            <AlertTriangle className="h-3 w-3" /> Docs Pending
                          </span>
                        )}
                        {p.requires_review && isAdmin && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 rounded px-1.5 py-0.5 shrink-0">
                            <Clock className="h-3 w-3" /> Needs Review
                          </span>
                        )}
                      </div>
                      {p.bank_metadata?.branch && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">Branch: {p.bank_metadata.branch}</p>
                      )}
                      <p className="text-sm text-slate-500 mt-0.5 truncate">{p.project_address}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        {p.bank_metadata?.bank_manager_name && (
                          <p className="text-xs text-slate-400 truncate">
                            Mgr: <span className="text-slate-600">{p.bank_metadata.bank_manager_name}</span>
                            {p.bank_metadata?.bank_manager_mob && (
                              <span className="text-slate-400"> · {p.bank_metadata.bank_manager_mob}</span>
                            )}
                          </p>
                        )}
                        {p.bank_metadata?.owner_name && (
                          <p className="text-xs text-slate-400 truncate">
                            Owner: <span className="text-slate-600">{p.bank_metadata.owner_name}</span>
                            {p.bank_metadata?.owner_mob && (
                              <span className="text-slate-400"> · {p.bank_metadata.owner_mob}</span>
                            )}
                          </p>
                        )}
                      </div>
                      {isAdmin && (
                        <p className="text-xs text-slate-400 mt-1 truncate">Created by: {p.profiles?.full_name}</p>
                      )}
                    </div>
                    <Badge className={cn(STATUS_COLORS[p.status as ProjectStatus], "shrink-0")}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
