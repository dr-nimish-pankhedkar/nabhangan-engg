/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markAttendance } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AttendanceMarker({ staffId, adminId }: { staffId: string; adminId: string }) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState("present");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMark() {
    setLoading(true);
    setError(null);
    const result = await markAttendance({ staffId, adminId, date, status });
    setLoading(false);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="border border-dashed border-slate-200 rounded-md p-3 space-y-2 mb-2">
      <p className="text-xs font-medium text-slate-600">Mark Attendance</p>
      <div className="flex gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-xs flex-1" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="text-xs flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="half_day">Half Day</SelectItem>
            <SelectItem value="leave">Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button size="sm" className="w-full bg-[#1e3a5f] text-white text-xs" onClick={handleMark} disabled={loading}>
        {loading ? "Marking…" : "Mark"}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
