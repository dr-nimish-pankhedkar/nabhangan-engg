/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS, UserRole } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ToggleActiveButton from "./toggle-active-button";

export default async function HRPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: staff } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  const { data: timelogs } = await supabase
    .from("time_logs")
    .select("user_id, hours_spent");

  const hoursByUser = (timelogs || []).reduce((acc: Record<string, number>, t: any) => {
    acc[t.user_id] = (acc[t.user_id] || 0) + Number(t.hours_spent);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800 mb-6">HR — Staff</h1>
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-600">Staff Members ({(staff || []).length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Name</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Role</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Phone</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Salary</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Total Hours</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {(staff || []).map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 px-3 text-slate-800 font-medium">{s.full_name}</td>
                    <td className="py-2 px-3 text-slate-600">{ROLE_LABELS[s.role as UserRole]}</td>
                    <td className="py-2 px-3 text-slate-600">{s.phone || "—"}</td>
                    <td className="py-2 px-3 text-slate-600">{s.salary ? `₹${Number(s.salary).toLocaleString()}` : "—"}</td>
                    <td className="py-2 px-3 text-slate-600">{(hoursByUser[s.id] || 0).toFixed(1)}h</td>
                    <td className="py-2 px-3">
                      <Badge variant={s.is_active ? "default" : "outline"} className={s.is_active ? "bg-green-100 text-green-700" : "text-slate-400"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      <ToggleActiveButton userId={s.id} isActive={s.is_active} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
