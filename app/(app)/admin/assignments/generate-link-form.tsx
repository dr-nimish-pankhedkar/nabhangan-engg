/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { generateThirdPartyToken } from "./generate-link-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Copy, CheckCircle } from "lucide-react";

const EXPIRY_OPTIONS = [
  { label: "2 hours", value: 2 },
  { label: "6 hours", value: 6 },
  { label: "12 hours", value: 12 },
  { label: "24 hours (1 day)", value: 24 },
  { label: "48 hours (2 days)", value: 48 },
  { label: "72 hours (3 days)", value: 72 },
];

export default function GenerateLinkForm({
  projects,
}: {
  projects: { id: string; bank_name: string; status: string }[];
}) {
  const [projectId, setProjectId] = useState("");
  const [surveyorName, setSurveyorName] = useState("");
  const [expiryHours, setExpiryHours] = useState(24);
  const [customHours, setCustomHours] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setError(null);
    setGeneratedUrl(null);
    if (!projectId) { setError("Select a project first."); return; }
    if (!surveyorName.trim()) { setError("Enter the surveyor's name."); return; }

    const hours = useCustom ? parseInt(customHours, 10) : expiryHours;
    if (!hours || hours < 1 || hours > 168) {
      setError("Expiry must be between 1 and 168 hours.");
      return;
    }

    setGenerating(true);
    const result = await generateThirdPartyToken({
      project_id: projectId,
      expiry_hours: hours,
      surveyor_name: surveyorName.trim(),
    });
    setGenerating(false);

    if (result.error) { setError(result.error); return; }
    const url = `${window.location.origin}/access/${result.token}`;
    setGeneratedUrl(url);
  }

  async function handleCopy() {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="pt-5 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Project</label>
          <Select onValueChange={setProjectId} value={projectId}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select a project…" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.bank_name}
                  <span className="ml-2 text-xs text-slate-400">({p.status})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Surveyor Name</label>
          <Input
            placeholder="e.g. Rajesh Patil"
            value={surveyorName}
            onChange={(e) => setSurveyorName(e.target.value)}
            className="text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Link valid for</label>
          {!useCustom ? (
            <div className="flex items-center gap-2">
              <Select
                value={String(expiryHours)}
                onValueChange={(v) => setExpiryHours(Number(v))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-slate-600 whitespace-nowrap"
                onClick={() => setUseCustom(true)}
              >
                Custom
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="168"
                placeholder="Hours (1–168)"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                className="text-sm"
              />
              <span className="text-sm text-slate-500">hours</span>
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-slate-600 whitespace-nowrap"
                onClick={() => { setUseCustom(false); setCustomHours(""); }}
              >
                Presets
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {generatedUrl ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Share this link with the surveyor:</p>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
              <span className="text-xs text-slate-700 truncate flex-1 font-mono">{generatedUrl}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 text-slate-400 hover:text-[#1e3a5f] transition-colors"
                title="Copy link"
              >
                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-amber-600">
              One-time use · link expires after the set duration. Generate a new one if needed.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => { setGeneratedUrl(null); setProjectId(""); setSurveyorName(""); }}
            >
              Generate Another
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white gap-2"
          >
            <Link2 className="h-4 w-4" />
            {generating ? "Generating…" : "Generate Survey Link"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
