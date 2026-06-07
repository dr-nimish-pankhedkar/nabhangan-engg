/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS, UserRole } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AdminStaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: staff } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  const { data: timelogs } = await supabase.from("time_logs").select("user_id, hours_spent");
  const { data: assignments } = await supabase.from("project_assignments").select("user_id, project_id");
  const { data: docs } = await supabase.from("staff_documents").select("user_id");

  const hoursByUser = (timelogs || []).reduce((acc: Record<string, number>, t: any) => {
    acc[t.user_id] = (acc[t.user_id] || 0) + Number(t.hours_spent);
    return acc;
  }, {});

  const assignmentsByUser = (assignments || []).reduce((acc: Record<string, number>, a: any) => {
    acc[a.user_id] = (acc[a.user_id] || 0) + 1;
    return acc;
  }, {});

  const docsByUser = (docs || []).reduce((acc: Record<string, number>, d: any) => {
    acc[d.user_id] = (acc[d.user_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-xl font-semibold text-slate-800">Staff Management</h1>
        <Link href="/admin/staff/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#162d4a] text-white gap-2">
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(staff || []).map((s: any) => (
          <Link key={s.id} href={`/admin/staff/${s.id}`}>
            <Card className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {s.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{s.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{s.designation || ROLE_LABELS[s.role as UserRole]}</p>
                    </div>
                  </div>
                  <Badge className={cn(s.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500", "shrink-0")}>
                    {s.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {s.employee_id && <p className="text-xs text-slate-400 mb-2">ID: {s.employee_id}</p>}
                <div className="grid grid-cols-3 gap-2 text-center border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1e3a5f]">{(hoursByUser[s.id] || 0).toFixed(0)}h</p>
                    <p className="text-xs text-slate-400">Hours</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1e3a5f]">{assignmentsByUser[s.id] || 0}</p>
                    <p className="text-xs text-slate-400">Projects</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1e3a5f]">{docsByUser[s.id] || 0}</p>
                    <p className="text-xs text-slate-400">Docs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
