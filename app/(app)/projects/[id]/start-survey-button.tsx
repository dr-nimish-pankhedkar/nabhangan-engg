/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startSurvey } from "./actions";
import { Button } from "@/components/ui/button";
import { MapPinned } from "lucide-react";

export default function StartSurveyButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await startSurvey(projectId);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-3 mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex-wrap">
      <MapPinned className="h-5 w-5 text-[#1e3a5f] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700">This project is still a Lead</p>
        <p className="text-xs text-slate-500">Start the survey to move it into the active workflow.</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <Button onClick={handleClick} disabled={loading} className="gap-2 bg-[#1e3a5f] hover:bg-[#162d4a] text-white shrink-0">
        {loading ? "Starting…" : "Start Survey →"}
      </Button>
    </div>
  );
}
