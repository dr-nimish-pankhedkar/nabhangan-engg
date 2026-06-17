/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { logTime, advanceStage } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CheckCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";

const submitSchema = z.object({
  hours_spent: z.string().optional(),
  notes: z.string().optional(),
});

export default function DispatchClient({ projectId, userId, isLocked }: { projectId: string; userId: string; isLocked: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(submitSchema), defaultValues: { hours_spent: "", notes: "" } });

  async function handleSubmit(data: { hours_spent?: string; notes?: string }) {
    setSubmitting(true);
    setError(null);
    try {
      const hours = parseFloat(data.hours_spent || "");
      if (hours > 0) {
        const timeResult = await logTime({ projectId, userId, stage: "dispatch", hours_spent: hours, notes: data.notes || null });
        if (timeResult.error) { setError(timeResult.error); return; }
      }
      const result = await advanceStage(projectId, "dispatch");
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
          <p className="text-sm font-semibold text-green-700">Case Dispatched & Locked</p>
          <p className="text-xs text-green-600/80">Dispatch has been recorded. Contact admin to re-open if changes are needed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="hours_spent" render={({ field }) => (
              <FormItem>
                <FormLabel>Hours Spent <span className="text-xs font-normal text-slate-400">(optional)</span></FormLabel>
                <FormControl><Input type="number" step="0.5" min="0.5" placeholder="e.g. 1.5" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Dispatch Notes <span className="text-xs font-normal text-slate-400">(optional)</span></FormLabel>
                <FormControl><Input placeholder="e.g. Courier name, tracking number…" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white gap-2">
            <CheckCircle className="h-4 w-4" />
            {submitting ? "Submitting…" : "Mark as Dispatched"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
