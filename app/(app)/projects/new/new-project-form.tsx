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
import { generateThirdPartyToken } from "@/app/(app)/admin/assignments/generate-link-action";
import { FEATURES } from "@/lib/features";
import { PROPERTY_TYPES, FACING_OPTIONS, RCC_OPTIONS, VALUATION_METHODS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, Info, MapPin, ChevronDown, Link2, Copy, CheckCircle } from "lucide-react";

const TP_VALUE = "__third_party__";

const EXPIRY_OPTS = [
  { label: "6 hours", value: 6 },
  { label: "12 hours", value: 12 },
  { label: "24 hours (1 day)", value: 24 },
  { label: "48 hours (2 days)", value: 48 },
  { label: "72 hours (3 days)", value: 72 },
];

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  designation: string | null;
}

const ASSIGNABLE_STAGES = [
  { value: "survey", label: "Survey" },
  { value: "rate_verification", label: "Rate Verification" },
  { value: "drafting", label: "Drafting Report" },
  { value: "checking", label: "Checking" },
  { value: "print", label: "Print" },
  { value: "scan", label: "Scan" },
  { value: "dispatch", label: "Dispatch" },
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
  // Additional info (pre-fill what you know)
  person_met: z.string().optional(),
  person_met_mob: z.string().optional(),
  site_visit_by: z.string().optional(),
  site_visit_by_mob: z.string().optional(),
  plot_area: z.string().optional(),
  carpet_area: z.string().optional(),
  builtup_area: z.string().optional(),
  construction_stage: z.string().optional(),
  use_of_property: z.string().optional(),
  age_of_building: z.string().optional(),
  occupied_by: z.string().optional(),
  lift: z.string().optional(),
  parking: z.string().optional(),
  rcc_type: z.string().optional(),
  road_width: z.string().optional(),
  total_floors: z.string().optional(),
  property_floor: z.string().optional(),
  no_of_rooms: z.string().optional(),
  no_of_toilets: z.string().optional(),
  total_flats: z.string().optional(),
  per_floor_flats: z.string().optional(),
  facing: z.string().optional(),
  boundary_east: z.string().optional(),
  boundary_west: z.string().optional(),
  boundary_north: z.string().optional(),
  boundary_south: z.string().optional(),
  nearby_rate: z.string().optional(),
  valuation_method: z.string().optional(),
  plot_area_val: z.string().optional(),
  plot_rate: z.string().optional(),
  plot_valuation: z.string().optional(),
  builtup_area_val: z.string().optional(),
  builtup_rate: z.string().optional(),
  builtup_valuation: z.string().optional(),
  extra_items: z.string().optional(),
  final_valuation: z.string().optional(),
  remark: z.string().optional(),
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide border-t border-slate-100 pt-3">{title}</p>
      {children}
    </div>
  );
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
  const [showAdditional, setShowAdditional] = useState(false);
  const [surveyIsThirdParty, setSurveyIsThirdParty] = useState(false);
  const [thirdPartyName, setThirdPartyName] = useState("");
  const [thirdPartyHours, setThirdPartyHours] = useState(48);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      person_met: data.person_met || "",
      person_met_mob: data.person_met_mob || "",
      site_visit_by: data.site_visit_by || "",
      site_visit_by_mob: data.site_visit_by_mob || "",
      plot_area: data.plot_area || "",
      carpet_area: data.carpet_area || "",
      builtup_area: data.builtup_area || "",
      construction_stage: data.construction_stage || "",
      use_of_property: data.use_of_property || "",
      age_of_building: data.age_of_building || "",
      occupied_by: data.occupied_by || "",
      lift: data.lift || "",
      parking: data.parking || "",
      rcc_type: data.rcc_type || "",
      road_width: data.road_width || "",
      total_floors: data.total_floors || "",
      property_floor: data.property_floor || "",
      no_of_rooms: data.no_of_rooms || "",
      no_of_toilets: data.no_of_toilets || "",
      total_flats: data.total_flats || "",
      per_floor_flats: data.per_floor_flats || "",
      facing: data.facing || "",
      boundary_east: data.boundary_east || "",
      boundary_west: data.boundary_west || "",
      boundary_north: data.boundary_north || "",
      boundary_south: data.boundary_south || "",
      nearby_rate: data.nearby_rate || "",
      valuation_method: data.valuation_method || "",
      plot_area_val: data.plot_area_val || "",
      plot_rate: data.plot_rate || "",
      plot_valuation: data.plot_valuation || "",
      builtup_area_val: data.builtup_area_val || "",
      builtup_rate: data.builtup_rate || "",
      builtup_valuation: data.builtup_valuation || "",
      extra_items: data.extra_items || "",
      final_valuation: data.final_valuation || "",
      remark: data.remark || "",
    };

    const assignmentsInput = isAdmin
      ? Object.entries(data.assignments || {})
          .filter(([, uid]) => uid && uid !== "none" && uid !== TP_VALUE && uid.length > 0)
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
    } else if (surveyIsThirdParty && thirdPartyName.trim() && result.id) {
      const tpResult = await generateThirdPartyToken({
        project_id: result.id,
        expiry_hours: thirdPartyHours,
        surveyor_name: thirdPartyName.trim(),
      });
      if (tpResult.error) {
        setError(`Case created but link generation failed: ${tpResult.error}`);
        setCreatedProjectId(result.id);
      } else if (tpResult.token) {
        setGeneratedLink(`${window.location.origin}/access/${tpResult.token}`);
        setCreatedProjectId(result.id);
      }
    } else {
      router.push(`/projects/${result.id}`);
    }
  }

  const F = form;

  if (generatedLink && createdProjectId) {
    return (
      <Card className="border-slate-200">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Case created successfully!</span>
          </div>
          <div className="rounded-md bg-purple-50 border border-purple-200 p-4 space-y-3">
            <p className="text-sm font-medium text-purple-800 flex items-center gap-1.5">
              <Link2 className="h-4 w-4" /> Third-party survey link
            </p>
            <p className="text-xs text-purple-600">Valid for {thirdPartyHours} hours. Share with {thirdPartyName}.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border border-purple-200 rounded px-2 py-1.5 break-all text-purple-900 font-mono">{generatedLink}</code>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(generatedLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="shrink-0 p-2 rounded border border-purple-200 bg-white hover:bg-purple-50 text-purple-700"
                title="Copy link"
              >
                {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white"
            onClick={() => router.push(`/projects/${createdProjectId}`)}
          >
            Go to Project
          </Button>
        </CardContent>
      </Card>
    );
  }

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

            <Section title="Case Identification">
              <Row>
                <FormField control={F.control} name="code_no" render={({ field }) => (
                  <FormItem><FormLabel>Code No.</FormLabel><FormControl><Input placeholder="e.g. NE-2026-001" {...field} /></FormControl><FormMessage /></FormItem>
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
                    <SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
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

            <Section title="Loan Details">
              <FormField control={F.control} name="loan_required" render={({ field }) => (
                <FormItem><FormLabel>Loan Required</FormLabel><FormControl><Input placeholder="e.g. ₹25,00,000" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </Section>

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

            {/* ── Additional Information (collapsible) ── */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdditional((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <div>
                  <span className="text-sm font-medium text-slate-700">Additional Information</span>
                  <span className="text-xs text-slate-400 ml-2">(optional — fill what you know; site engineer can update on-site)</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ${showAdditional ? "rotate-180" : ""}`} />
              </button>

              {showAdditional && (
                <div className="px-4 pb-4 pt-3 space-y-4 border-t border-slate-100">

                  <SubSection title="Site Contact">
                    <Row>
                      <FormField control={F.control} name="person_met" render={({ field }) => (
                        <FormItem><FormLabel>Person to Meet on Site</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={F.control} name="person_met_mob" render={({ field }) => (
                        <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </Row>
                    <Row>
                      <FormField control={F.control} name="site_visit_by" render={({ field }) => (
                        <FormItem><FormLabel>Site Visit to be Done By</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={F.control} name="site_visit_by_mob" render={({ field }) => (
                        <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </Row>
                  </SubSection>

                  <SubSection title="Property Dimensions">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <FormField control={F.control} name="plot_area" render={({ field }) => (
                        <FormItem><FormLabel>Plot Area</FormLabel><FormControl><Input placeholder="e.g. 100 sq.mt" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="carpet_area" render={({ field }) => (
                        <FormItem><FormLabel>Carpet Area</FormLabel><FormControl><Input placeholder="e.g. 75 sq.mt" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="builtup_area" render={({ field }) => (
                        <FormItem><FormLabel>B/Up Area</FormLabel><FormControl><Input placeholder="e.g. 85 sq.mt" {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                  </SubSection>

                  <SubSection title="Property Details">
                    <Row>
                      <FormField control={F.control} name="construction_stage" render={({ field }) => (
                        <FormItem><FormLabel>Construction Stage</FormLabel><FormControl><Input placeholder="e.g. Completed" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="use_of_property" render={({ field }) => (
                        <FormItem><FormLabel>Use of Property</FormLabel><FormControl><Input placeholder="e.g. Residential" {...field} /></FormControl></FormItem>
                      )} />
                    </Row>
                    <Row>
                      <FormField control={F.control} name="age_of_building" render={({ field }) => (
                        <FormItem><FormLabel>Age of Building</FormLabel><FormControl><Input placeholder="e.g. 5 years" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="occupied_by" render={({ field }) => (
                        <FormItem><FormLabel>Occupied By</FormLabel><FormControl><Input placeholder="e.g. Owner" {...field} /></FormControl></FormItem>
                      )} />
                    </Row>
                  </SubSection>

                  <SubSection title="Building Features">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <FormField control={F.control} name="total_floors" render={({ field }) => (
                        <FormItem><FormLabel>Total Floors</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="property_floor" render={({ field }) => (
                        <FormItem><FormLabel>Property Floor</FormLabel><FormControl><Input placeholder="e.g. 2nd" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="road_width" render={({ field }) => (
                        <FormItem><FormLabel>Road Width</FormLabel><FormControl><Input placeholder="e.g. 12 ft" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="no_of_rooms" render={({ field }) => (
                        <FormItem><FormLabel>Rooms</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="no_of_toilets" render={({ field }) => (
                        <FormItem><FormLabel>Toilets</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="total_flats" render={({ field }) => (
                        <FormItem><FormLabel>Total Flats</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="per_floor_flats" render={({ field }) => (
                        <FormItem><FormLabel>Per Floor Flats</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="lift" render={({ field }) => (
                        <FormItem><FormLabel>Lift</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={F.control} name="parking" render={({ field }) => (
                        <FormItem><FormLabel>Parking</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={F.control} name="rcc_type" render={({ field }) => (
                      <FormItem><FormLabel>Construction Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                          <SelectContent>{RCC_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </SubSection>

                  <SubSection title="Facing &amp; Boundaries">
                    <FormField control={F.control} name="facing" render={({ field }) => (
                      <FormItem><FormLabel>Facing</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select direction" /></SelectTrigger></FormControl>
                          <SelectContent>{FACING_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-3">
                      {(["east", "west", "north", "south"] as const).map((dir) => (
                        <FormField key={dir} control={F.control} name={`boundary_${dir}` as any} render={({ field }) => (
                          <FormItem><FormLabel className="capitalize">{dir}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                      ))}
                    </div>
                  </SubSection>

                  <SubSection title="Valuation Summary">
                    <Row>
                      <FormField control={F.control} name="nearby_rate" render={({ field }) => (
                        <FormItem><FormLabel>Nearby / Recommended Rate</FormLabel><FormControl><Input placeholder="e.g. ₹5,000/sq.ft" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="valuation_method" render={({ field }) => (
                        <FormItem><FormLabel>Method Adopted</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                            <SelectContent>{VALUATION_METHODS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    </Row>
                    <div className="grid grid-cols-3 gap-2">
                      <FormField control={F.control} name="plot_area_val" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Plot Area</FormLabel><FormControl><Input placeholder="area" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="plot_rate" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">× Rate (₹)</FormLabel><FormControl><Input placeholder="rate" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="plot_valuation" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">= Rs.</FormLabel><FormControl><Input placeholder="value" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="builtup_area_val" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">B/Up Area</FormLabel><FormControl><Input placeholder="area" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="builtup_rate" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">× Rate (₹)</FormLabel><FormControl><Input placeholder="rate" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="builtup_valuation" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">= Rs.</FormLabel><FormControl><Input placeholder="value" {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                    <Row>
                      <FormField control={F.control} name="extra_items" render={({ field }) => (
                        <FormItem><FormLabel>Extra Items / Services (Rs.)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={F.control} name="final_valuation" render={({ field }) => (
                        <FormItem><FormLabel className="font-semibold text-[#1e3a5f]">Final Valuation Say (Rs.)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                    </Row>
                    <FormField control={F.control} name="remark" render={({ field }) => (
                      <FormItem><FormLabel>Remark</FormLabel><FormControl><textarea className="w-full min-h-[72px] border border-slate-200 rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20" {...field} /></FormControl></FormItem>
                    )} />
                  </SubSection>

                </div>
              )}
            </div>

            {/* Staff Assignments */}
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
                        <Select
                          onValueChange={(v) => {
                            field.onChange(v);
                            if (stage.value === "survey") setSurveyIsThirdParty(v === TP_VALUE);
                          }}
                          value={field.value || ""}
                        >
                          <FormControl><SelectTrigger className="text-sm"><SelectValue placeholder="No staff assigned" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="none">No staff assigned</SelectItem>
                            {staff.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.full_name}{s.designation && <span className="text-slate-400 ml-1">— {s.designation}</span>}
                              </SelectItem>
                            ))}
                            {stage.value === "survey" && FEATURES.thirdPartyLinks && (
                              <SelectItem value={TP_VALUE}>
                                <span className="flex items-center gap-1.5 text-purple-700">
                                  <Link2 className="h-3.5 w-3.5 inline" /> Third Party (generate link)
                                </span>
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {stage.value === "survey" && surveyIsThirdParty && (
                        <div className="ml-[92px] mt-2 p-3 bg-purple-50 border border-purple-200 rounded-md space-y-2">
                          <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">
                              Surveyor Name <span className="text-red-400">*</span>
                            </label>
                            <Input
                              value={thirdPartyName}
                              onChange={(e) => setThirdPartyName(e.target.value)}
                              placeholder="e.g. Rajesh Kumar"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Link valid for</label>
                            <Select value={String(thirdPartyHours)} onValueChange={(v) => setThirdPartyHours(Number(v))}>
                              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {EXPIRY_OPTS.map((opt) => (
                                  <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
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
