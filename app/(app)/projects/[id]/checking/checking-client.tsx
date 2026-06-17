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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CheckCircle, LockKeyhole, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import ReferenceFiles, { type RefFile } from "../reference-files";

const timeSchema = z.object({
  hours_spent: z.string().min(1).refine((v) => parseFloat(v) > 0, "Must be > 0"),
  notes: z.string().optional(),
});

export default function CheckingClient({ projectId, userId, isLocked, refFiles }: { projectId: string; userId: string; isLocked: boolean; refFiles: RefFile[] }) {
  const router = useRouter();
  const [timeLogged, setTimeLogged] = useState(false);
  const [showTimePrompt, setShowTimePrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(timeSchema), defaultValues: { hours_spent: "", notes: "" } });

  async function onTimeSubmit(data: any) {
    const result = await logTime({ projectId, userId, stage: "checking", hours_spent: parseFloat(data.hours_spent), notes: data.notes || null });
    if (result.error) setError(result.error);
    else setTimeLogged(true);
  }

  async function doAdvance() {
    const result = await advanceStage(projectId, "print");
    if (result.error) setError(result.error);
    else router.push(`/projects/${projectId}`);
  }

  async function handleAdvance() {
    if (!timeLogged) { setShowTimePrompt(true); return; }
    await doAdvance();
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
      {!showTimePrompt && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Log Time</CardTitle></CardHeader>
          <CardContent>
            {timeLogged ? (
              <div className="flex items-center gap-2 text-green-600 text-sm"><CheckCircle className="h-4 w-4" />Time logged</div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onTimeSubmit)} className="space-y-4">
                  <FormField control={form.control} name="hours_spent" render={({ field }) => (
                    <FormItem><FormLabel>Hours Spent</FormLabel><FormControl><Input type="number" step="0.5" min="0.5" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#162d4a] text-white">Log Time</Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {showTimePrompt && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Log your hours first? (optional)</p>
            <p className="text-xs text-amber-600 mt-0.5">Time tracking helps with reports, but you can skip it.</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowTimePrompt(false)}>
                Go Back &amp; Log Time
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => { setShowTimePrompt(false); doAdvance(); }}>
                Skip &amp; Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      <Button onClick={handleAdvance} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#162d4a] text-white">
        Checking Complete → Print
      </Button>
    </div>
  );
}
