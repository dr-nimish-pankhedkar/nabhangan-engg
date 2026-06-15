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
import { createProject } from "./actions";
import { PROPERTY_TYPES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, Info, MapPin } from "lucide-react";

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
  // Case identification
  code_no: z.string().optional(),
  bank_name: z.string().min(1, "Bank name required"),
  branch: z.string().optional(),
  bank_manager_name: z.string().optional(),
  bank_manager_mob: z.string().optional(),
  hlc_dsa_name: z.string().optional(),
  hlc_dsa_mob: z.string().optional(),
  // Owner details
  owner_name: z.string().optional(),
  owner_mob: z.string().optional(),
  proposed_owner: z.string().optional(),
  proposed_owner_mob: z.string().optional(),
  // Property type
  property_type: z.string().optional(),
  // Address
  flat_house_no: z.string().optional(),
  building_name: z.string().optional(),
  plot_no: z.string().optional(),
  survey_no: z.string().optional(),
  project_address: z.string().min(1, "Address required"),
  landmark_1: z.string().optional(),
  landmark_2: z.string().optional(),
  // Loan
  loan_required: z.string().optional(),
  // Tentative GPS
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  // Staff assignment (admin only)
  assignments: z.object({
    survey: z.string().optional(),
    drafting: z.string().optional(),
    report: z.string().optional(),
    review: z.string().optional(),
  }).optional(),
});

type FormData = z.infer<typeof schema>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

export default function NewProjectForm({
  userId,
  staff,
  isAdmin,
}: {
  userId: string;
  staff: StaffMember[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { assignments: {} },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const bankMetadata: Record<string, string> = {
      code_no: data.code_no || "",
      branch: data.branch || "",
      bank_manager_name: data.bank_manager_name || "",
      bank_manager_mob: data.bank_manager_mob || "",
      hlc_dsa_name: data.hlc_dsa_name || "",
      hlc_dsa_mob: data.hlc_dsa_mob || "",
      owner_name: data.owner_name || "",
      owner_mob: data.owner_mob || "",
      proposed_owner: data.proposed_owner || "",
      proposed_owner_mob: data.proposed_owner_mob || "",
      property_type: data.property_type || "",
      flat_house_no: data.flat_house_no || "",
      building_name: data.building_name || "",
      plot_no: data.plot_no || "",
      survey_no: data.survey_no || "",
      landmark_1: data.landmark_1 || "",
      landmark_2: data.landmark_2 || "",
      loan_required: data.loan_required || "",
    };

    const assignmentsInput = isAdmin
      ? Object.entries(data.assignments || {})
          .filter(([, uid]) => uid && uid !== "none" && uid.length > 0)
          .map(([stage, uid]) => ({ stage, user_id: uid as string }))
      : [];

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

  const F = form;

  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        {!isAdmin && (
          <div className="flex items-start gap-2 mb-5 rounded-md bg-blue-50 border border-blue-200 px-4 py-3">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700">
              This case will be sent to admin for review and staff assignment before becoming active.
            </p>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Case Identification */}
            <Section title="Case Identification">
              <Row>
                <FormField control={F.control} name="code_no" render={({ field }) => (
                  <FormItem><FormLabel>Code No.</FormLabel><FormControl><Input placeholder="e.g. NE-2026-001" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={F.control} name="bank_name" render={({ field }) => (
                  <FormItem><FormLabel>Bank Name <span className="text-red-400">*</span></FormLabel><FormControl><Input placeholder="e.g. HDFC Bank" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </Row>
              <FormField control={F.control} name="branch" render={({ field }) => (
                <FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="Branch name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Row>
                <FormField control={F.control} name="bank_manager_name" render={({ field }) => (
                  <FormItem><FormLabel>Bank Manager Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={F.control} name="bank_manager_mob" render={({ field }) => (
                  <FormItem><FormLabel>Manager Mobile</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </Row>
              <Row>
                <FormField control={F.control} name="hlc_dsa_name" render={({ field }) => (
                  <FormItem><FormLabel>HLC / DSA Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={F.control} name="hlc_dsa_mob" render={({ field }) => (
                  <FormItem><FormLabel>HLC / DSA Mobile</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </Row>
            </Section>

            {/* Owner Details */}
            <Section title="Owner Details">
              <Row>
                <FormField control={F.control} name="owner_name" render={({ field }) => (
                  <FormItem><FormLabel>Name of Owner</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={F.control} name="owner_mob" render={({ field }) => (
                  <FormItem><FormLabel>Owner Mobile</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </Row>
              <Row>
                <FormField control={F.control} name="proposed_owner" render={({ field }) => (
                  <FormItem><FormLabel>Proposed Owner</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={F.control} name="proposed_owner_mob" render={({ field }) => (
                  <FormItem><FormLabel>Proposed Owner Mobile</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </Row>
            </Section>

            {/* Property Type */}
            <Section title="Type of Property">
              <FormField control={F.control} name="property_type" render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </Section>

            {/* Property Address */}
            <Section title="Property Address">
              <Row>
                <FormField control={F.control} name="flat_house_no" render={({ field }) => (
                  <FormItem><FormLabel>Flat / House No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={F.control} name="building_name" render={({ field }) => (
                  <FormItem><FormLabel>Name of Building</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </Row>
              <Row>
                <FormField control={F.control} name="plot_no" render={({ field }) => (
                  <FormItem><FormLabel>Plot No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={F.control} name="survey_no" render={({ field }) => (
                  <FormItem><FormLabel>Survey No. (S.No.)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </Row>
              <FormField control={F.control} name="project_address" render={({ field }) => (
                <FormItem><FormLabel>Full Address <span className="text-red-400">*</span></FormLabel><FormControl><Input placeholder="Complete property address" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Row>
                <FormField control={F.control} name="landmark_1" render={({ field }) => (
                  <FormItem><FormLabel>Landmark 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={F.control} name="landmark_2" render={({ field }) => (
                  <FormItem><FormLabel>Landmark 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </Row>
            </Section>

            {/* Loan Details */}
            <Section title="Loan Details">
              <FormField control={F.control} name="loan_required" render={({ field }) => (
                <FormItem><FormLabel>Loan Required</FormLabel><FormControl><Input placeholder="e.g. ₹25,00,000" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </Section>

            {/* Tentative Location */}
            <Section title="Tentative Location (Staff Estimate)">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <MapPin className="h-3.5 w-3.5" />
                Site engineer will record the precise GPS on-site during survey.
              </div>
              <Row>
                <FormField control={F.control} name="latitude" render={({ field }) => (
                  <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" step="any" placeholder="e.g. 18.5204" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={F.control} name="longitude" render={({ field }) => (
                  <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" step="any" placeholder="e.g. 73.8567" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </Row>
            </Section>

            {/* Staff Assignments — admin only */}
            {isAdmin && (
              <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="h-4 w-4 text-[#1e3a5f]" />
                  <span className="text-sm font-medium text-slate-700">Assign Staff to Stages</span>
                  <span className="text-xs text-slate-400">(optional)</span>
                </div>
                {ASSIGNABLE_STAGES.map((stage) => (
                  <FormField key={stage.value} control={F.control} name={`assignments.${stage.value}` as any} render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-3">
                        <FormLabel className="w-20 text-xs text-slate-500 shrink-0">{stage.label}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="No staff assigned" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No staff assigned</SelectItem>
                            {staff.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.full_name}{s.designation && <span className="text-slate-400 ml-1">— {s.designation}</span>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </FormItem>
                  )} />
                ))}
                {staff.length === 0 && <p className="text-xs text-slate-400">No active staff found.</p>}
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600 font-medium">Error: {error}</p>
              </div>
            )}
            <Button type="submit" className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#162d4a] text-white" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating…" : "Create Case"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
