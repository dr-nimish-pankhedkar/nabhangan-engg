/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveCase } from "./actions";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function ApproveCaseButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setLoading(true);
    setError(null);
    const result = await approveCase(projectId);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-3 mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex-wrap">
      <CheckCircle className="h-5 w-5 text-blue-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-800">Case Pending Admin Review</p>
        <p className="text-xs text-blue-600">Submitted by staff. Assign staff to stages, then approve to activate.</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <Button
        onClick={handleApprove}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
      >
        {loading ? "Approving…" : "Approve Case"}
      </Button>
    </div>
  );
}
