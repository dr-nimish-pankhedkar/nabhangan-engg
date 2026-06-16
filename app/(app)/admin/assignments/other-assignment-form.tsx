/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addOtherAssignment, removeOtherAssignment } from "./other-assignment-actions";
import { X } from "lucide-react";

interface StaffMember { id: string; full_name: string; designation: string | null; }
interface OtherAssignment { id: string; user_id: string; task_description: string; assigned_at: string; profiles?: { full_name: string }[] | null; }

export default function OtherAssignmentForm({
  staff,
  existing,
}: {
  staff: StaffMember[];
  existing: OtherAssignment[];
}) {
  const [userId, setUserId] = useState("");
  const [task, setTask] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleAdd() {
    if (!userId || !task.trim()) return;
    setSaving(true);
    setError(null);
    const res = await addOtherAssignment({ user_id: userId, task_description: task.trim() });
    if (res.error) setError(res.error);
    else { setUserId(""); setTask(""); }
    setSaving(false);
  }

  async function handleRemove(id: string) {
    setRemoving(id);
    await removeOtherAssignment(id);
    setRemoving(null);
  }

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="flex gap-2 flex-wrap">
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger className="text-sm w-48">
            <SelectValue placeholder="Select staff" />
          </SelectTrigger>
          <SelectContent>
            {staff.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.full_name}{s.designation ? ` — ${s.designation}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="text-sm flex-1 min-w-[200px]"
          placeholder="Task description…"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button
          className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white text-sm shrink-0"
          onClick={handleAdd}
          disabled={!userId || !task.trim() || saving}
        >
          {saving ? "Assigning…" : "Assign"}
        </Button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Existing other assignments */}
      {existing.length === 0 ? (
        <p className="text-xs text-slate-400">No other tasks assigned yet.</p>
      ) : (
        <div className="space-y-1.5">
          {existing.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{a.profiles?.[0]?.full_name}</p>
                <p className="text-xs text-slate-500 truncate">{a.task_description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-slate-400">
                  {new Date(a.assigned_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
                </span>
                <button
                  onClick={() => handleRemove(a.id)}
                  disabled={removing === a.id}
                  className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
