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
import { logTime } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CheckCircle, PartyPopper } from "lucide-react";

const timeSchema = z.object({
  hours_spent: z.string().min(1).refine((v) => parseFloat(v) > 0, "Must be > 0"),
  notes: z.string().optional(),
});

export default function DispatchClient({ projectId, userId }: { projectId: string; userId: string }) {
  const [dispatched, setDispatched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(timeSchema), defaultValues: { hours_spent: "", notes: "" } });

  async function onTimeSubmit(data: any) {
    const result = await logTime({ projectId, userId, stage: "dispatch", hours_spent: parseFloat(data.hours_spent), notes: data.notes || null });
    if (result.error) setError(result.error);
    else setDispatched(true);
  }

  return (
    <div className="space-y-6">
      {dispatched ? (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-4">
          <PartyPopper className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700">Case Dispatched</p>
            <p className="text-xs text-green-600/80">All stages complete. The report has been dispatched.</p>
          </div>
        </div>
      ) : (
        <Card className="border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Log Dispatch</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onTimeSubmit)} className="space-y-4">
                <FormField control={form.control} name="hours_spent" render={({ field }) => (
                  <FormItem><FormLabel>Hours Spent</FormLabel><FormControl><Input type="number" step="0.5" min="0.5" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Dispatch Notes</FormLabel><FormControl><Input placeholder="e.g. Courier name, tracking number…" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Mark as Dispatched
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
