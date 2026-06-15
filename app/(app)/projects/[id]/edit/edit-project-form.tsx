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
import { updateProjectInfo } from "../actions";
import { PROPERTY_TYPES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, MapPin } from "lucide-react";

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
  code_no: z.string().optional(),
  bank_name: z.string().min(1, "Bank name required"),
  branch: z.string().optional(),
  bank_manager_name: z.string().optional(),
  bank_manager_mob: z.string().optional(),
  hlc_dsa_name: z.string().optional(),
  hlc_dsa_mob: z.string().optional(),
  owner_name: z.string().optional(),
  owner_mob: z.string().optional(),
  proposed_owner: z.string().optional(),
  proposed_owner_mob: z.string().optional(),
  property_type: z.string().optional(),
  flat_house_no: z.string().optional(),
  building_name: z.string().optional(),
  plot_no: z.string().optional(),
  survey_no: z.string().optional(),
  project_address: z.string().min(1, "Address required"),
  landmark_1: z.string().optional(),
  landmark_2: z.string().optional(),
  loan_required: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
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

function str(v: unknown): string { return typeof v === "string" ? v : ""; }

export default function EditProjectForm({
  projectId,
  project,
  staff,
  currentAssignments,
}: {
  projectId: string;
  project: any;
  staff: StaffMember[];
  currentAssignments: Record<string, string>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const m = project.bank_metadata || {};

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      code_no: str(m.code_no),
      bank_name: project.bank_name || "",
      branch: str(m.branch),
      bank_manager_name: str(m.bank_manager_name),
      bank_manager_mob: str(m.bank_manager_mob),
      hlc_dsa_name: str(m.hlc_dsa_name),
      hlc_dsa_mob: str(m.hlc_dsa_mob),
      owner_name: str(m.owner_name),
      owner_mob: str(m.owner_mob),
      proposed_owner: str(m.proposed_owner),
      proposed_owner_mob: str(m.proposed_owner_mob),
      property_type: str(m.property_type),
      flat_house_no: str(m.flat_house_no),
      building_name: str(m.building_name),
      plot_no: str(m.plot_no),
      survey_no: str(m.survey_no),
      project_address: project.project_address || "",
      landmark_1: str(m.landmark_1),
      landmark_2: str(m.landmark_2),
      loan_required: str(m.loan_required),
      latitude: project.latitude != null ? String(project.latitude) : "",
      longitude: project.longitude != null ? String(project.longitude) : "",
      assignments: {
        survey: currentAssignments.survey || "",
        drafting: currentAssignments.drafting || "",
        report: currentAssignments.report || "",
        review: currentAssignments.review || "",
      },
    },
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

    const assignmentsInput = Object.entries(data.assignments || {})
      .filter(([, uid]) => uid && uid !== "none" && uid.length > 0)
      .map(([stage, uid]) => ({ stage, user_id: uid as string }));

    const result = await updateProjectInfo(projectId, {
      bank_name: data.bank_name,
      project_address: data.project_address,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      bank_metadata: bankMetadata,
      assignments: assignmentsInput,
    });

    if (result.error) {
      setError(result.error);
    } else {
      router.push(`/projects/${projectId}`);
      router.refresh();
    }
  }

  const F = form;

  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <Section title="Case Identification">
              <Row>
                <FormField control={F.control} name="code_no" render={({ field }) => (
                  <FormItem><FormLabel>Code No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={F.control} name="bank_name" render={({ field }) => (
                  <FormItem><FormLabel>Bank Name <span className="text-red-400">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </Row>
              <FormField control={F.control} name="branch" render={({ field }) => (
                <FormItem><FormLabel>Branch</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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

            <Section title="Type of Property">
              <FormField control={F.control} name="property_type" render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </Section>

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
                <FormItem><FormLabel>Full Address <span className="text-red-400">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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

            <Section title="Loan Details">
              <FormField control={F.control} name="loan_required" render={({ field }) => (
                <FormItem><FormLabel>Loan Required</FormLabel><FormControl><Input placeholder="e.g. ₹25,00,000" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </Section>

            <Section title="Tentative Location">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <MapPin className="h-3.5 w-3.5" />
                Site engineer records the precise GPS during survey visit.
              </div>
              <Row>
                <FormField control={F.control} name="latitude" render={({ field }) => (
                  <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={F.control} name="longitude" render={({ field }) => (
                  <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </Row>
            </Section>

            {/* Staff Assignments */}
            <div className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="h-4 w-4 text-[#1e3a5f]" />
                <span className="text-sm font-medium text-slate-700">Staff Assignments</span>
                <span className="text-xs text-slate-400">(replaces current)</span>
              </div>
              {ASSIGNABLE_STAGES.map((stage) => (
                <FormField key={stage.value} control={F.control} name={`assignments.${stage.value}` as any} render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <FormLabel className="w-20 text-xs text-slate-500 shrink-0">{stage.label}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl><SelectTrigger className="text-sm"><SelectValue placeholder="No staff assigned" /></SelectTrigger></FormControl>
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
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600 font-medium">Error: {error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push(`/projects/${projectId}`)}>Cancel</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
