/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createProject } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, UserCheck } from "lucide-react";

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  designation: string | null;
}

const ASSIGNABLE_STAGES = [
  { value: "survey", label: "Survey" },
  { value: "drafting", label: "Drafting" },
  { value: "report", label: "Report" },
  { value: "review", label: "Review" },
];

const schema = z.object({
  bank_name: z.string().min(1, "Bank name required"),
  project_address: z.string().min(1, "Address required"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  metadata: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  assignments: z.object({
    survey: z.string().optional(),
    drafting: z.string().optional(),
    report: z.string().optional(),
    review: z.string().optional(),
  }).optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewProjectForm({
  userId,
  staff,
}: {
  userId: string;
  staff: StaffMember[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { metadata: [], assignments: {} },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "metadata",
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const bankMetadata = (data.metadata || []).reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const assignmentsInput = Object.entries(data.assignments || {})
      .filter(([, userId]) => userId && userId !== "none" && userId.length > 0)
      .map(([stage, userId]) => ({ stage, user_id: userId as string }));

    const result = await createProject({
      bank_name: data.bank_name,
      project_address: data.project_address,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      bank_metadata: bankMetadata,
      created_by: userId,
      assignments: assignmentsInput,
    });

    if (result.error) {
      setError(result.error);
    } else {
      router.push(`/projects/${result.id}`);
    }
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="project_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Address</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude (optional)</FormLabel>
                    <FormControl><Input type="number" step="any" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude (optional)</FormLabel>
                    <FormControl><Input type="number" step="any" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bank Metadata */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <FormLabel>Bank Metadata</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ key: "", value: "" })}
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3 w-3" /> Add Field
                </Button>
              </div>
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`metadata.${idx}.key`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl><Input placeholder="Key" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`metadata.${idx}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl><Input placeholder="Value" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(idx)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Assignments */}
            <div className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="h-4 w-4 text-[#1e3a5f]" />
                <span className="text-sm font-medium text-slate-700">Assign Staff to Stages</span>
                <span className="text-xs text-slate-400">(optional)</span>
              </div>
              {ASSIGNABLE_STAGES.map((stage) => (
                <FormField
                  key={stage.value}
                  control={form.control}
                  name={`assignments.${stage.value}` as any}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-3">
                        <FormLabel className="w-20 text-xs text-slate-500 shrink-0">{stage.label}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="No staff assigned" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No staff assigned</SelectItem>
                            {staff.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.full_name}
                                {s.designation && (
                                  <span className="text-slate-400 ml-1">— {s.designation}</span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </FormItem>
                  )}
                />
              ))}
              {staff.length === 0 && (
                <p className="text-xs text-slate-400">No active staff found. Add staff first.</p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600 font-medium">Error: {error}</p>
              </div>
            )}
            <Button
              type="submit"
              className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Creating…" : "Create Project"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
