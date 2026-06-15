/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleDocumentsPending } from "./actions";
import { AlertTriangle } from "lucide-react";

export default function DocumentsPendingToggle({
  projectId,
  initialValue,
}: {
  projectId: string;
  initialValue: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.checked;
    setLoading(true);
    const result = await toggleDocumentsPending(projectId, newValue);
    setLoading(false);
    if (!result.error) {
      setPending(newValue);
      router.refresh();
    }
  }

  return (
    <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-md border transition-colors ${
      pending ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50"
    } ${loading ? "opacity-60" : ""}`}>
      <input
        type="checkbox"
        checked={pending}
        onChange={handleChange}
        disabled={loading}
        className="h-4 w-4 rounded border-slate-300 accent-amber-500"
      />
      <AlertTriangle className={`h-4 w-4 shrink-0 ${pending ? "text-amber-500" : "text-slate-300"}`} />
      <span className={`text-sm font-medium ${pending ? "text-amber-700" : "text-slate-500"}`}>
        Documents Pending
      </span>
    </label>
  );
}
