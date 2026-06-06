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
import ChecklistForm from "./checklist-form";

export default async function ChecklistsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: templates } = await supabase
    .from("checklist_templates")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Checklist Templates</h1>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Create New Template</h2>
        <ChecklistForm userId={user.id} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Existing Templates</h2>
        {!templates || templates.length === 0 ? (
          <p className="text-sm text-slate-500">No templates yet.</p>
        ) : (
          <div className="space-y-3">
            {templates.map((t: any) => (
              <Card key={t.id} className="border-slate-200">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {t.name}
                    <Badge className={STATUS_COLORS[t.stage as ProjectStatus]}>{t.stage}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 pt-0">
                  <p className="text-xs text-slate-400">{(t.fields || []).length} fields</p>
                  <div className="mt-2 space-y-1">
                    {(t.fields || []).map((f: any, i: number) => (
                      <div key={i} className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1 flex items-center gap-2">
                        <span className="font-medium">{f.label}</span>
                        <Badge variant="outline" className="text-xs">{f.type}</Badge>
                        {f.required && <Badge variant="outline" className="text-xs text-red-500">required</Badge>}
                      </div>
                    ))}
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
