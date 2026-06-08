/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { advanceProjectStage } from "./actions";
import { Button } from "@/components/ui/button";
import { ProjectStatus } from "@/lib/types";
import { ArrowRightCircle } from "lucide-react";

export default function AdvanceStageButton({
  projectId,
  nextStatus,
  nextLabel,
}: {
  projectId: string;
  nextStatus: ProjectStatus;
  nextLabel: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await advanceProjectStage(projectId, nextStatus);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-3 mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex-wrap">
      <ArrowRightCircle className="h-5 w-5 text-amber-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700">This stage&apos;s checklist is already complete</p>
        <p className="text-xs text-slate-500">It looks like the work was submitted but the project didn&apos;t move forward. You can advance it manually.</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <Button onClick={handleClick} disabled={loading} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shrink-0">
        {loading ? "Moving…" : `Move to ${nextLabel} →`}
      </Button>
    </div>
  );
}
