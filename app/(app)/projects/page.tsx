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
import { Plus } from "lucide-react";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
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
          <h1 className="text-xl font-semibold text-slate-800 mb-6">Projects</h1>
          <p className="text-slate-500 text-sm">No projects assigned to you.</p>
        </div>
      );
    }
    query = query.in("id", ids);
  }

  if (activeStage) {
    query = query.eq("status", activeStage);
  }

  const { data: projects } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Projects</h1>
        {isAdmin && (
          <Link href="/projects/new">
            <Button className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Link href="/projects">
          <Badge variant={!activeStage ? "default" : "outline"} className={!activeStage ? "bg-[#1e3a5f]" : "cursor-pointer"}>
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
      </div>

      {!projects || projects.length === 0 ? (
        <p className="text-slate-500 text-sm">No projects found.</p>
      ) : (
        <div className="space-y-3">
          {projects.map((p: any) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="border-slate-200 hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{p.bank_name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{p.project_address}</p>
                      {isAdmin && (
                        <p className="text-xs text-slate-400 mt-1">Created by: {p.profiles?.full_name}</p>
                      )}
                    </div>
                    <Badge className={STATUS_COLORS[p.status as ProjectStatus]}>
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
