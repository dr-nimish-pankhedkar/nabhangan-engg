/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { uploadProjectFile } from "@/lib/storage";
import { logFileRecord, logTime, advanceStage } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Upload, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import ReferenceFiles, { type RefFile } from "../reference-files";

const submitSchema = z.object({
  hours_spent: z.string().optional(),
  notes: z.string().optional(),
});

export default function RateVerificationClient({ projectId, userId, isLocked, refFiles }: { projectId: string; userId: string; isLocked: boolean; refFiles: RefFile[] }) {
  const router = useRouter();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const form = useForm({ resolver: zodResolver(submitSchema), defaultValues: { hours_spent: "", notes: "" } });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(10);
    try {
      setUploadProgress(40);
      const url = await uploadProjectFile(projectId, "rate_verification", file);
      setUploadProgress(80);
      await logFileRecord({ projectId, userId, stage: "rate_verification", filePath: url, fileName: file.name, fileType: file.type });
      setUploadProgress(100);
      setUploadedFile(file.name);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(data: { hours_spent?: string; notes?: string }) {
    setSubmitting(true);
    setError(null);
    try {
      const hours = parseFloat(data.hours_spent || "");
      if (hours > 0) {
        const timeResult = await logTime({ projectId, userId, stage: "rate_verification", hours_spent: hours, notes: data.notes || null });
        if (timeResult.error) { setError(timeResult.error); return; }
      }
      const result = await advanceStage(projectId, "drafting");
      if (result.error) setError(result.error);
      else router.push(`/projects/${projectId}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (isLocked) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-4">
        <LockKeyhole className="h-5 w-5 text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-700">Stage Submitted & Locked</p>
          <p className="text-xs text-green-600/80">This stage has been submitted. Contact your admin to make changes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReferenceFiles files={refFiles} />
      <Card className="border-slate-200">
        <CardHeader className="pb-3"><CardTitle className="text-sm">Upload Rate Sheet (Excel)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.ods" className="hidden" onChange={handleFileUpload} />
          <Button variant="outline" className="w-full sm:w-auto gap-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4" />{uploading ? "Uploading…" : "Choose File"}
          </Button>
          {uploading && <Progress value={uploadProgress} className="h-2" />}
          {uploadedFile && <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle className="h-4 w-4" />{uploadedFile} uploaded</div>}
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="hours_spent" render={({ field }) => (
              <FormItem>
                <FormLabel>Hours Spent <span className="text-xs font-normal text-slate-400">(optional)</span></FormLabel>
                <FormControl><Input type="number" step="0.5" min="0.5" placeholder="e.g. 2.5" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes <span className="text-xs font-normal text-slate-400">(optional)</span></FormLabel>
                <FormControl><Input placeholder="Any remarks…" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#162d4a] text-white">
            {submitting ? "Submitting…" : "Rate Verification Complete → Drafting"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
