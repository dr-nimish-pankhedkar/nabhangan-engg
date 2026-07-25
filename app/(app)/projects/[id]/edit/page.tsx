/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChevronRight } from "lucide-react";
import EditProjectForm from "./edit-project-form";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const [projectRes, staffRes, assignmentsRes] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase.from("profiles").select("id, full_name, role, designation").eq("is_active", true).order("full_name"),
    supabase.from("project_assignments").select("user_id, stage").eq("project_id", id),
  ]);

  if (!projectRes.data) notFound();

  const project = projectRes.data;
  const staff = staffRes.data || [];
  const assignments = assignmentsRes.data || [];

  const currentAssignments = assignments.reduce((acc: Record<string, string>, a: any) => {
    acc[a.stage] = a.user_id;
    return acc;
  }, {});

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6 min-w-0 flex-wrap">
        <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-700 shrink-0">Cases</Link>
        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        <Link href={`/projects/${id}`} className="text-sm text-slate-500 hover:text-slate-700 truncate min-w-0">
          {project.bank_name}
        </Link>
        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        <span className="text-sm font-semibold text-slate-800 shrink-0">Edit</span>
      </div>

      <EditProjectForm
        projectId={id}
        project={project}
        staff={staff}
        currentAssignments={currentAssignments}
      />
    </div>
  );
}
