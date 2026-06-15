/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProjectFiles } from "./actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const STAGE_LABEL: Record<string, string> = {
  survey: "Survey",
  rate_verification: "Rate Verif.",
  drafting: "Drafting",
  checking: "Checking",
  print: "Print",
  scan: "Scan",
  dispatch: "Dispatch",
};

interface FileItem {
  id: string;
  file_name: string;
  stage: string;
  uploaded_at: string;
}

export default function FileManager({ files }: { files: FileItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === files.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(files.map((f) => f.id)));
    }
  }

  async function handleDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Permanently delete ${selected.size} file(s)? This cannot be undone.`)) return;
    setLoading(true);
    setError(null);
    const result = await deleteProjectFiles([...selected]);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSelected(new Set());
      router.refresh();
    }
  }

  if (files.length === 0) {
    return <p className="text-sm text-slate-400">No files uploaded for this case.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            className="rounded"
            checked={selected.size === files.length && files.length > 0}
            onChange={toggleAll}
          />
          Select all ({files.length})
        </label>
        {selected.size > 0 && (
          <Button
            size="sm"
            variant="destructive"
            className="h-7 text-xs gap-1.5"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {loading ? "Deleting…" : `Delete Selected (${selected.size})`}
          </Button>
        )}
      </div>

      <div className="space-y-1.5">
        {files.map((f) => (
          <label
            key={f.id}
            className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-md cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100"
          >
            <input
              type="checkbox"
              className="rounded shrink-0"
              checked={selected.has(f.id)}
              onChange={() => toggle(f.id)}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-700 truncate">{f.file_name}</p>
              <p className="text-[10px] text-slate-400">
                {STAGE_LABEL[f.stage] || f.stage} · {new Date(f.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </label>
        ))}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
