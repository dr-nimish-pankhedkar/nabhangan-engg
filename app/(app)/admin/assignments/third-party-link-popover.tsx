/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { generateThirdPartyToken } from "./generate-link-action";
import { Copy, CheckCircle, RefreshCw } from "lucide-react";

type Status = "submitted" | "active" | "expired";

const EXPIRY_OPTS = [
  { label: "6 hours", value: 6 },
  { label: "12 hours", value: 12 },
  { label: "24 hours", value: 24 },
  { label: "48 hours", value: 48 },
  { label: "72 hours", value: 72 },
];

export default function ThirdPartyLinkPopover({
  projectId,
  surveyorName,
  status,
  token,
}: {
  projectId: string;
  surveyorName: string;
  status: Status;
  token: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [regenName, setRegenName] = useState(surveyorName);
  const [regenHours, setRegenHours] = useState(48);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [newLink, setNewLink] = useState<string | null>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const activeLink = `${window.location.origin}/access/${token}`;

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegen() {
    if (!regenName.trim()) return;
    setRegenLoading(true);
    setRegenError(null);
    const result = await generateThirdPartyToken({
      project_id: projectId,
      expiry_hours: regenHours,
      surveyor_name: regenName.trim(),
    });
    setRegenLoading(false);
    if (result.error) {
      setRegenError(result.error);
    } else if (result.token) {
      setNewLink(`${window.location.origin}/access/${result.token}`);
    }
  }

  const badgeClass =
    status === "submitted"
      ? "bg-green-100 text-green-700 border-green-200"
      : status === "active"
      ? "bg-purple-100 text-purple-700 border-purple-200"
      : "bg-slate-100 text-slate-400 border-slate-200";

  const indicator = status === "submitted" ? "✓" : status === "active" ? "⏳" : "✕";

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 font-medium border rounded cursor-pointer hover:opacity-80 whitespace-nowrap ${badgeClass}`}
        title={status === "active" ? "View / copy link" : status === "expired" ? "Generate new link" : "Submitted by third party"}
      >
        {indicator} {surveyorName}
      </button>

      {open && (
        <div className="absolute left-0 top-7 z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-3 w-72 space-y-3 text-xs">
          <p className="font-semibold text-slate-700">{surveyorName}</p>

          {status === "submitted" && (
            <p className="text-green-700">Survey submitted successfully. No further action needed.</p>
          )}

          {status === "active" && !newLink && (
            <>
              <p className="text-slate-500">Link is active. Copy and share with the surveyor.</p>
              <div className="flex items-center gap-1.5">
                <code className="flex-1 text-[10px] bg-slate-50 border border-slate-200 rounded px-2 py-1.5 break-all font-mono text-slate-700">
                  {activeLink}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeLink)}
                  className="shrink-0 p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-600"
                  title="Copy link"
                >
                  {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </>
          )}

          {status === "expired" && !newLink && (
            <>
              <p className="text-amber-600">This link has expired. Generate a new one below.</p>
              <div className="space-y-2">
                <input
                  value={regenName}
                  onChange={(e) => setRegenName(e.target.value)}
                  placeholder="Surveyor name"
                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]/30"
                />
                <select
                  value={regenHours}
                  onChange={(e) => setRegenHours(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]/30"
                >
                  {EXPIRY_OPTS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {regenError && <p className="text-red-500 text-[10px]">{regenError}</p>}
                <button
                  type="button"
                  onClick={handleRegen}
                  disabled={regenLoading || !regenName.trim()}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1e3a5f] hover:bg-[#162d4a] text-white rounded text-xs disabled:opacity-60 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  {regenLoading ? "Generating…" : "Generate New Link"}
                </button>
              </div>
            </>
          )}

          {newLink && (
            <>
              <p className="text-green-700 font-medium">New link generated!</p>
              <div className="flex items-center gap-1.5">
                <code className="flex-1 text-[10px] bg-slate-50 border border-slate-200 rounded px-2 py-1.5 break-all font-mono text-slate-700">
                  {newLink}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(newLink)}
                  className="shrink-0 p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-600"
                  title="Copy link"
                >
                  {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
