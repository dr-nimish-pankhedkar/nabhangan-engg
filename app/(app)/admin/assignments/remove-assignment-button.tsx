/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeAssignment } from "./actions";
import { X } from "lucide-react";

export default function RemoveAssignmentButton({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    await removeAssignment(assignmentId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      title="Remove assignment"
      className="shrink-0 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-40"
    >
      <X className="h-2.5 w-2.5" />
    </button>
  );
}
