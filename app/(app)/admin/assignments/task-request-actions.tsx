/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewTaskRequest } from "./actions";
import { Button } from "@/components/ui/button";

export default function TaskRequestActions({ requestId, adminId }: { requestId: string; adminId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handle(status: "approved" | "rejected") {
    setLoading(status);
    await reviewTaskRequest({ requestId, adminId, status });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => handle("approved")} disabled={!!loading}>
        {loading === "approved" ? "…" : "Approve"}
      </Button>
      <Button size="sm" variant="outline" className="text-red-500 text-xs border-red-200" onClick={() => handle("rejected")} disabled={!!loading}>
        {loading === "rejected" ? "…" : "Reject"}
      </Button>
    </div>
  );
}
