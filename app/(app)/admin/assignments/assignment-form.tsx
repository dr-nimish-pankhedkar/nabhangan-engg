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
import { createAssignment } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  project_id: z.string().min(1, "Select a project"),
  user_id: z.string().min(1, "Select a staff member"),
  stage: z.enum(["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch", "fees_received"]),
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

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { project_id: "", user_id: "", stage: "survey" },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    setSuccess(false);
    const result = await createAssignment(data);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      form.reset();
      router.refresh();
    }
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
                <Select onValueChange={field.onChange} value={field.value}>
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
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">Assignment created successfully.</p>}

            <Button
              type="submit"
              className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Assigning…" : "Assign"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
