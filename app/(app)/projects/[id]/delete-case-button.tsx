/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "./actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteCaseButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Permanently delete "${projectName}" and all its data (files, reports, assignments, time logs)? This cannot be undone.`)) return;
    setLoading(true);
    const result = await deleteProject(projectId);
    if (result.error) {
      alert(result.error);
      setLoading(false);
    } else {
      router.push("/projects");
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shrink-0"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {loading ? "Deleting…" : "Delete Case"}
    </Button>
  );
}
