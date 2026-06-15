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
import { PROJECT_STAGES } from "@/lib/types";
import { createTemplate } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const fieldSchema = z.object({
  label: z.string().min(1, "Label required"),
  type: z.enum(["text", "number", "boolean", "select"]),
  required: z.boolean(),
  options: z.string().optional(),
});

const schema = z.object({
  name: z.string().min(1, "Name required"),
  stage: z.enum(["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch"]),
  fields: z.array(fieldSchema).min(1, "At least one field required"),
});

type FormData = z.infer<typeof schema>;

export default function ChecklistForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      stage: "survey",
      fields: [{ label: "", type: "text", required: false, options: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "fields" });

  async function onSubmit(data: FormData) {
    setError(null);
    const processedFields = data.fields.map((f) => ({
      label: f.label,
      type: f.type,
      required: f.required,
      ...(f.type === "select" && f.options ? { options: f.options.split(",").map((o) => o.trim()).filter(Boolean) } : {}),
    }));
    const result = await createTemplate({ name: data.name, stage: data.stage, fields: processedFields, created_by: userId });
    if (result.error) {
      setError(result.error);
    } else {
      form.reset();
      router.refresh();
    }
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="stage" render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <FormLabel>Fields</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => append({ label: "", type: "text", required: false, options: "" })}
                >
                  <Plus className="h-3 w-3" /> Add Field
                </Button>
              </div>
              <div className="space-y-3">
                {fields.map((field, idx) => (
                  <div key={field.id} className="border border-slate-200 rounded-md p-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <FormField control={form.control} name={`fields.${idx}.label`} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Label</FormLabel>
                          <FormControl><Input {...field} className="text-sm" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`fields.${idx}.type`} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="boolean">Boolean</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="flex items-center gap-4">
                      <FormField control={form.control} name={`fields.${idx}.required`} render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                          </FormControl>
                          <FormLabel className="text-xs !mt-0">Required</FormLabel>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`fields.${idx}.options`} render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input {...field} placeholder="Options (comma-separated, for select type)" className="text-xs" />
                          </FormControl>
                        </FormItem>
                      )} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#162d4a] text-white" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating…" : "Create Template"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
