/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_COLORS, ProjectStatus } from "@/lib/types";
import { markComplete } from "./actions";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect(`/projects/${id}`);

  const [filesRes, responsesRes, timelogsRes] = await Promise.all([
    supabase.from("project_files").select("*, profiles(full_name)").eq("project_id", id).order("uploaded_at", { ascending: false }),
    supabase.from("checklist_responses").select("*, profiles(full_name), checklist_templates(name)").eq("project_id", id).order("submitted_at", { ascending: false }),
    supabase.from("time_logs").select("*, profiles(full_name)").eq("project_id", id).order("logged_at", { ascending: false }),
  ]);

  const files = filesRes.data || [];
  const responses = responsesRes.data || [];
  const timelogs = timelogsRes.data || [];
  const totalHours = timelogs.reduce((sum: number, t: any) => sum + Number(t.hours_spent), 0);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Review Stage</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border-slate-200"><CardContent className="pt-4"><p className="text-2xl font-bold text-[#1e3a5f]">{files.length}</p><p className="text-xs text-slate-400">Files uploaded</p></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="pt-4"><p className="text-2xl font-bold text-[#1e3a5f]">{responses.length}</p><p className="text-xs text-slate-400">Checklists submitted</p></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="pt-4"><p className="text-2xl font-bold text-[#1e3a5f]">{totalHours.toFixed(1)}h</p><p className="text-xs text-slate-400">Total hours</p></CardContent></Card>
      </div>

      <div className="space-y-4 mb-6">
        {files.length > 0 && (
          <Card className="border-slate-200">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Files</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {files.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 rounded px-3 py-2">
                  <span>{f.file_name}</span>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[f.stage as ProjectStatus]}>{f.stage}</Badge>
                    <span className="text-xs text-slate-400">{f.profiles?.full_name}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {responses.length > 0 && (
          <Card className="border-slate-200">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Checklist Responses</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {responses.map((r: any) => (
                <div key={r.id} className="text-sm text-slate-600 bg-slate-50 rounded px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.checklist_templates?.name}</span>
                    <Badge className={STATUS_COLORS[r.stage as ProjectStatus]}>{r.stage}</Badge>
                  </div>
                  {r.remarks && <p className="text-xs text-slate-400 mt-1">{r.remarks}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">by {r.profiles?.full_name}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <form action={markComplete.bind(null, id)}>
        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
          Mark Project Complete
        </Button>
      </form>
    </div>
  );
}
