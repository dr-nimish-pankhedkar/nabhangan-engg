/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS, UserRole, DOC_TYPES, ATTENDANCE_STATUS_COLORS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, ChevronRight } from "lucide-react";
import StaffDocumentUpload from "./document-upload";
import AttendanceMarker from "./attendance-marker";
import ToggleActiveButton from "@/app/(app)/hr/toggle-active-button";

export default async function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (adminProfile?.role !== "admin") redirect("/dashboard");

  const { data: staff } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!staff) notFound();

  const [docsRes, attendanceRes, timelogsRes, assignmentsRes] = await Promise.all([
    supabase.from("staff_documents").select("*").eq("user_id", id).order("uploaded_at", { ascending: false }),
    supabase.from("attendance").select("*").eq("user_id", id).order("date", { ascending: false }).limit(30),
    supabase.from("time_logs").select("hours_spent, logged_at, stage, projects(bank_name)").eq("user_id", id).order("logged_at", { ascending: false }).limit(20),
    supabase.from("project_assignments").select("*, projects(bank_name, status)").eq("user_id", id).order("assigned_at", { ascending: false }),
  ]);

  const docs = docsRes.data || [];
  const attendance = attendanceRes.data || [];
  const timelogs = timelogsRes.data || [];
  const assignments = assignmentsRes.data || [];
  const totalHours = timelogs.reduce((sum: number, t: any) => sum + Number(t.hours_spent), 0);
  const presentDays = attendance.filter((a: any) => a.status === "present" || a.status === "half_day").length;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm text-slate-500">
        <Link href="/admin/staff" className="hover:text-slate-700">Staff</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-800 font-medium">{staff.full_name}</span>
      </div>

      {/* Header */}
      <Card className="border-slate-200 mb-6">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xl font-bold">
                {staff.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800">{staff.full_name}</h2>
                <p className="text-slate-500">{staff.designation || ROLE_LABELS[staff.role as UserRole]}</p>
                {staff.employee_id && <p className="text-xs text-slate-400 mt-0.5">ID: {staff.employee_id}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ToggleActiveButton userId={staff.id} isActive={staff.is_active} />
              <Link href={`/admin/staff/${staff.id}/edit`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100">
            <div><p className="text-xs text-slate-400">Role</p><p className="text-sm font-medium text-slate-700">{ROLE_LABELS[staff.role as UserRole]}</p></div>
            <div><p className="text-xs text-slate-400">Phone</p><p className="text-sm font-medium text-slate-700">{staff.phone || "—"}</p></div>
            <div><p className="text-xs text-slate-400">Date of Birth</p><p className="text-sm font-medium text-slate-700">{staff.dob ? new Date(staff.dob).toLocaleDateString("en-IN") : "—"}</p></div>
            <div><p className="text-xs text-slate-400">Date of Joining</p><p className="text-sm font-medium text-slate-700">{staff.doj ? new Date(staff.doj).toLocaleDateString("en-IN") : "—"}</p></div>
            <div><p className="text-xs text-slate-400">Salary</p><p className="text-sm font-medium text-slate-700">{staff.salary ? `₹${Number(staff.salary).toLocaleString("en-IN")}` : "—"}</p></div>
            <div><p className="text-xs text-slate-400">Address</p><p className="text-sm font-medium text-slate-700">{staff.address || "—"}</p></div>
            <div><p className="text-xs text-slate-400">Emergency Contact</p><p className="text-sm font-medium text-slate-700">{staff.emergency_contact || "—"}</p></div>
            <div><p className="text-xs text-slate-400">Status</p><Badge className={staff.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}>{staff.is_active ? "Active" : "Inactive"}</Badge></div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border-slate-200"><CardContent className="pt-4"><p className="text-2xl font-bold text-[#1e3a5f]">{totalHours.toFixed(1)}h</p><p className="text-xs text-slate-400">Total Hours Logged</p></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="pt-4"><p className="text-2xl font-bold text-[#1e3a5f]">{assignments.length}</p><p className="text-xs text-slate-400">Project Assignments</p></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="pt-4"><p className="text-2xl font-bold text-[#1e3a5f]">{presentDays}</p><p className="text-xs text-slate-400">Days Present (last 30)</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Documents */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm">Documents ({docs.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {docs.map((d: any) => {
              const docLabel = DOC_TYPES.find((t) => t.value === d.doc_type)?.label || d.doc_type;
              return (
                <div key={d.id} className="flex items-center justify-between bg-slate-50 rounded px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-slate-700">{d.file_name}</p>
                    <p className="text-xs text-slate-400">{docLabel}</p>
                  </div>
                </div>
              );
            })}
            <StaffDocumentUpload staffId={id} adminId={user.id} />
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Attendance (last 30 entries)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <AttendanceMarker staffId={id} adminId={user.id} />
            {attendance.slice(0, 10).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{new Date(a.date).toLocaleDateString("en-IN")}</span>
                <Badge className={ATTENDANCE_STATUS_COLORS[a.status]}>
                  {a.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Project Assignments</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {assignments.length === 0 ? <p className="text-xs text-slate-400">No assignments.</p> : assignments.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between bg-slate-50 rounded px-3 py-2">
                <p className="text-xs text-slate-700">{a.projects?.bank_name}</p>
                <Badge className="text-xs bg-blue-100 text-blue-700">{a.stage}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Time Logs */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Time Logs</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {timelogs.length === 0 ? <p className="text-xs text-slate-400">No time logged.</p> : timelogs.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{(t.projects as any)?.bank_name} — {t.stage}</span>
                <span className="font-medium text-[#1e3a5f]">{t.hours_spent}h</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
