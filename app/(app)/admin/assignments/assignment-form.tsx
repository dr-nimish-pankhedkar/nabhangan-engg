/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PROJECT_STAGES } from "@/lib/types";
import { FEATURES } from "@/lib/features";
import { createAssignment } from "./actions";
import { generateThirdPartyToken } from "./generate-link-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Copy, CheckCircle } from "lucide-react";

const TP_VALUE = "__third_party__";

const EXPIRY_OPTS = [
  { label: "2 hours", value: 2 },
  { label: "6 hours", value: 6 },
  { label: "12 hours", value: 12 },
  { label: "24 hours (1 day)", value: 24 },
  { label: "48 hours (2 days)", value: 48 },
  { label: "72 hours (3 days)", value: 72 },
];

const schema = z.object({
  project_id: z.string().min(1, "Select a project"),
  user_id: z.string().min(1, "Select a staff member"),
  stage: z.enum(["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch"]),
});

type FormData = z.infer<typeof schema>;

export default function AssignmentForm({
  projects,
  staff,
}: {
  projects: { id: string; bank_name: string; status: string }[];
  staff: { id: string; full_name: string; role: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [surveyorName, setSurveyorName] = useState("");
  const [expiryHours, setExpiryHours] = useState(24);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { project_id: "", user_id: "", stage: "survey" },
  });

  const watchedUserId = form.watch("user_id");
  const watchedStage = form.watch("stage");
  const isThirdParty = watchedUserId === TP_VALUE && watchedStage === "survey";

  async function onSubmit(data: FormData) {
    setError(null);
    setSuccess(false);
    setGeneratedUrl(null);

    if (data.user_id === TP_VALUE) {
      if (!surveyorName.trim()) { setError("Enter the surveyor's name."); return; }
      if (data.stage !== "survey") { setError("Third Party is only available for the Survey stage."); return; }
      const result = await generateThirdPartyToken({
        project_id: data.project_id,
        expiry_hours: expiryHours,
        surveyor_name: surveyorName.trim(),
      });
      if (result.error) { setError(result.error); return; }
      setGeneratedUrl(`${window.location.origin}/access/${result.token}`);
      router.refresh();
      return;
    }

    const result = await createAssignment(data);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      form.reset();
      router.refresh();
    }
  }

  async function handleCopy() {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="project_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select project…" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.bank_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="stage" render={({ field }) => (
              <FormItem>
                <FormLabel>Stage</FormLabel>
                <Select
                  onValueChange={(v) => {
                    field.onChange(v);
                    // Clear third-party selection if stage changes away from survey
                    if (v !== "survey" && form.getValues("user_id") === TP_VALUE) {
                      form.setValue("user_id", "");
                    }
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROJECT_STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="user_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Staff Member</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select staff…" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                    ))}
                    {FEATURES.thirdPartyLinks && watchedStage === "survey" && (
                      <SelectItem value={TP_VALUE}>
                        <span className="flex items-center gap-1.5 text-purple-700">
                          <Link2 className="h-3.5 w-3.5 inline" /> Third Party (generate link)
                        </span>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Inline Third Party fields */}
            {isThirdParty && (
              <div className="rounded-md bg-purple-50 border border-purple-200 p-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Surveyor Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={surveyorName}
                    onChange={(e) => setSurveyorName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Link valid for</label>
                  <Select value={String(expiryHours)} onValueChange={(v) => setExpiryHours(Number(v))}>
                    <SelectTrigger className="text-sm bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPIRY_OPTS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">Assignment created successfully.</p>}

            {/* Generated link display */}
            {generatedUrl && (
              <div className="rounded-md bg-purple-50 border border-purple-200 p-3 space-y-2">
                <p className="text-xs font-medium text-purple-800 flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" /> Share this link with {surveyorName}
                </p>
                <div className="flex items-center gap-2 bg-white border border-purple-200 rounded px-2.5 py-1.5">
                  <span className="text-xs text-slate-700 font-mono truncate flex-1">{generatedUrl}</span>
                  <button type="button" onClick={handleCopy} className="shrink-0 text-slate-400 hover:text-purple-600">
                    {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-purple-600">One-time use · expires in {expiryHours}h</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setGeneratedUrl(null);
                    setSurveyorName("");
                    form.reset();
                  }}
                >
                  Generate Another
                </Button>
              </div>
            )}

            {!generatedUrl && (
              <Button
                type="submit"
                className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white gap-2"
                disabled={form.formState.isSubmitting}
              >
                {isThirdParty && <Link2 className="h-4 w-4" />}
                {form.formState.isSubmitting
                  ? (isThirdParty ? "Generating…" : "Assigning…")
                  : (isThirdParty ? "Generate Survey Link" : "Assign")}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
