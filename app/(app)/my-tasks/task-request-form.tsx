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
import { submitTaskRequest } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  project_id: z.string().optional(),
  stage: z.enum(["lead", "survey", "drafting", "report", "review"]).optional(),
  message: z.string().min(5, "Please describe the task you want"),
});

type FormData = z.infer<typeof schema>;

export default function TaskRequestForm({
  userId,
  projects,
}: {
  userId: string;
  projects: { id: string; bank_name: string; status: string }[];
}) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { message: "" },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const result = await submitTaskRequest({ userId, ...data });
    if (result.error) setError(result.error);
    else {
      setSuccess(true);
      form.reset();
      router.refresh();
    }
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="pt-4">
        {success ? (
          <p className="text-sm text-green-600">Request submitted! Admin will review it.</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="project_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project (optional)</FormLabel>
                    <Select onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Any project" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.bank_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="stage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage (optional)</FormLabel>
                    <Select onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Any stage" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {PROJECT_STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>Message *</FormLabel>
                  <FormControl><Input placeholder="Describe the task you're requesting…" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Submitting…" : "Submit Request"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
