/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { revokeStageSubmission } from "./actions";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export default function RevokeStageButton({ projectId, stage }: { projectId: string; stage: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    setLoading(true);
    await revokeStageSubmission(projectId, stage);
    router.refresh();
    setLoading(false);
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleRevoke}
      disabled={loading}
      className="h-5 text-[10px] px-2 py-0 gap-1 border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
    >
      <RotateCcw className="h-2.5 w-2.5" />
      Revoke
    </Button>
  );
}
