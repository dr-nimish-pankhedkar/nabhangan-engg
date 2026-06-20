/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { uploadProjectFile } from "@/lib/storage";
import { logFileRecord, saveSiteVisitReport, submitSiteVisitReport, updateCaseInfoFromSurvey, logTime, deletePhoto } from "./actions";
import { FACING_OPTIONS, RCC_OPTIONS, VALUATION_METHODS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Camera, Locate, X, AlertTriangle, Pencil, LockKeyhole, Clock } from "lucide-react";

const MAX_PHOTOS = 10;
const MAX_PHOTO_SIZE_MB = 5;

const timeSchema = z.object({
  hours_spent: z.string().min(1).refine((v) => parseFloat(v) > 0, "Must be > 0"),
  notes: z.string().optional(),
});

const schema = z.object({
  visit_date: z.string().optional(),
  plot_area: z.string().optional(),
  carpet_area: z.string().optional(),
  builtup_area: z.string().optional(),
  construction_stage: z.string().optional(),
  use_of_property: z.string().optional(),
  age_of_building: z.string().optional(),
  occupied_by: z.string().optional(),
  lift: z.string().optional(),
  road_width: z.string().optional(),
  total_floors: z.string().optional(),
  property_floor: z.string().optional(),
  no_of_rooms: z.string().optional(),
  no_of_toilets: z.string().optional(),
  total_flats: z.string().optional(),
  per_floor_flats: z.string().optional(),
  parking: z.string().optional(),
  rcc_type: z.string().optional(),
  precise_latitude: z.string().optional(),
  precise_longitude: z.string().optional(),
  facing: z.string().optional(),
  boundary_east: z.string().optional(),
  boundary_west: z.string().optional(),
  boundary_north: z.string().optional(),
  boundary_south: z.string().optional(),
  person_met: z.string().optional(),
  person_met_mob: z.string().optional(),
  site_visit_by: z.string().optional(),
  site_visit_by_mob: z.string().optional(),
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
});

type FormData = z.infer<typeof schema>;

function str(v: unknown): string { return typeof v === "string" ? v : ""; }

function d(report: Record<string, string> | null, bm: Record<string, unknown>, key: string): string {
  if (report?.[key]) return report[key];
  if (bm && typeof bm[key] === "string") return bm[key] as string;
  return "";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="py-3 px-4 pb-0">
        <CardTitle className="text-sm text-[#1e3a5f] font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-3 space-y-3">{children}</CardContent>
    </Card>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm text-slate-700 font-medium">{value || <span className="text-slate-300 font-normal">—</span>}</span>
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs"
      />
    </div>
  );
}

type CustomField = { key: string; label: string };

export default function SurveyStageClient({
  projectId,
  userId,
  project,
  existingReport,
  existingPhotos,
  isLocked,
  customFields = [],
}: {
  projectId: string;
  userId: string;
  project: any;
  existingReport: Record<string, string> | null;
  existingPhotos: { id: string; file_name: string; file_path: string; uploaded_at: string }[];
  isLocked: boolean;
  customFields?: CustomField[];
}) {
  const router = useRouter();
  const m = project.bank_metadata || {};

  const [editingLead, setEditingLead] = useState(false);
  const [leadEdits, setLeadEdits] = useState<Record<string, string>>({
    bank_name: str(project.bank_name),
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
    project_address: str(project.project_address),
    landmark_1: str(m.landmark_1),
    landmark_2: str(m.landmark_2),
    loan_required: str(m.loan_required),
  });
  const [savingLead, setSavingLead] = useState(false);
  const [leadSaveError, setLeadSaveError] = useState<string | null>(null);
  const [customValues, setCustomValues] = useState<Record<string, string>>(
    customFields.reduce((acc, cf) => ({ ...acc, [cf.key]: existingReport?.[cf.key] || "" }), {})
  );

  function setField(key: string) {
    return (v: string) => setLeadEdits((prev) => ({ ...prev, [key]: v }));
  }

  async function handleSaveLead() {
    setSavingLead(true);
    setLeadSaveError(null);
    const result = await updateCaseInfoFromSurvey(projectId, {
      bank_name: leadEdits.bank_name,
      project_address: leadEdits.project_address,
      bank_metadata: { ...m, ...leadEdits },
    });
    setSavingLead(false);
    if (result.error) {
      setLeadSaveError(result.error);
    } else {
      setEditingLead(false);
      router.refresh();
    }
  }

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      visit_date: d(existingReport, m, "visit_date"),
      plot_area: d(existingReport, m, "plot_area"),
      carpet_area: d(existingReport, m, "carpet_area"),
      builtup_area: d(existingReport, m, "builtup_area"),
      construction_stage: d(existingReport, m, "construction_stage"),
      use_of_property: d(existingReport, m, "use_of_property"),
      age_of_building: d(existingReport, m, "age_of_building"),
      occupied_by: d(existingReport, m, "occupied_by"),
      lift: d(existingReport, m, "lift"),
      road_width: d(existingReport, m, "road_width"),
      total_floors: d(existingReport, m, "total_floors"),
      property_floor: d(existingReport, m, "property_floor"),
      no_of_rooms: d(existingReport, m, "no_of_rooms"),
      no_of_toilets: d(existingReport, m, "no_of_toilets"),
      total_flats: d(existingReport, m, "total_flats"),
      per_floor_flats: d(existingReport, m, "per_floor_flats"),
      parking: d(existingReport, m, "parking"),
      rcc_type: d(existingReport, m, "rcc_type"),
      precise_latitude: d(existingReport, m, "precise_latitude"),
      precise_longitude: d(existingReport, m, "precise_longitude"),
      facing: d(existingReport, m, "facing"),
      boundary_east: d(existingReport, m, "boundary_east"),
      boundary_west: d(existingReport, m, "boundary_west"),
      boundary_north: d(existingReport, m, "boundary_north"),
      boundary_south: d(existingReport, m, "boundary_south"),
      person_met: d(existingReport, m, "person_met"),
      person_met_mob: d(existingReport, m, "person_met_mob"),
      site_visit_by: d(existingReport, m, "site_visit_by"),
      site_visit_by_mob: d(existingReport, m, "site_visit_by_mob"),
      nearby_rate: d(existingReport, m, "nearby_rate"),
      valuation_method: d(existingReport, m, "valuation_method"),
      plot_area_val: d(existingReport, m, "plot_area_val"),
      plot_rate: d(existingReport, m, "plot_rate"),
      plot_valuation: d(existingReport, m, "plot_valuation"),
      builtup_area_val: d(existingReport, m, "builtup_area_val"),
      builtup_rate: d(existingReport, m, "builtup_rate"),
      builtup_valuation: d(existingReport, m, "builtup_valuation"),
      extra_items: d(existingReport, m, "extra_items"),
      final_valuation: d(existingReport, m, "final_valuation"),
      remark: d(existingReport, m, "remark"),
    },
  });

  const [photosUploaded, setPhotosUploaded] = useState<{ id: string; file_name: string }[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saveDraftMsg, setSaveDraftMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [timeLogged, setTimeLogged] = useState(false);
  const [showTimePrompt, setShowTimePrompt] = useState(false);
  const timeForm = useForm({ resolver: zodResolver(timeSchema), defaultValues: { hours_spent: "", notes: "" } });
  const [locating, setLocating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const visibleExisting = existingPhotos.filter((p) => !deletedPhotoIds.has(p.id));
  const totalPhotos = visibleExisting.length + photosUploaded.length;
  const remaining = MAX_PHOTOS - totalPhotos;

  function handleGetLocation() {
    if (!navigator.geolocation) { setSubmitError("Geolocation not supported by your browser."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("precise_latitude", String(pos.coords.latitude.toFixed(6)));
        form.setValue("precise_longitude", String(pos.coords.longitude.toFixed(6)));
        setLocating(false);
      },
      (err) => {
        setSubmitError("Could not get location: " + err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadError(null);

    const oversized = files.filter((f) => f.size > MAX_PHOTO_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      setUploadError(`Each photo must be under ${MAX_PHOTO_SIZE_MB}MB. ${oversized.map(f => f.name).join(", ")} too large.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    if (files.length > remaining) {
      setUploadError(`You can upload ${remaining} more photo(s). ${MAX_PHOTOS} max per case.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setUploadingCount(files.length);
    let done = 0;
    const newPhotos: { id: string; file_name: string }[] = [];

    for (const file of files) {
      try {
        setUploadProgress(Math.round((done / files.length) * 100));
        const path = await uploadProjectFile(projectId, "survey", file);
        const result = await logFileRecord({ projectId, userId, stage: "survey", filePath: path, fileName: file.name, fileType: file.type });
        if (result.error) { setUploadError(result.error); continue; }
        if (result.id) newPhotos.push({ id: result.id, file_name: file.name });
        done++;
        setUploadProgress(Math.round((done / files.length) * 100));
      } catch (err: any) {
        setUploadError(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    setPhotosUploaded((prev) => [...prev, ...newPhotos]);
    setUploadingCount(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDeletePhoto(fileId: string, isExisting: boolean) {
    setDeletingId(fileId);
    setUploadError(null);
    const result = await deletePhoto(fileId);
    setDeletingId(null);
    if (result.error) { setUploadError(result.error); return; }
    if (isExisting) {
      setDeletedPhotoIds((prev) => new Set([...prev, fileId]));
    } else {
      setPhotosUploaded((prev) => prev.filter((p) => p.id !== fileId));
    }
  }

  async function handleSaveDraft(data: FormData) {
    setSaveDraftMsg(null);
    setSubmitError(null);
    const result = await saveSiteVisitReport({ projectId, data: { ...(data as Record<string, string>), ...customValues } });
    if (result.error) setSubmitError(result.error);
    else setSaveDraftMsg("Draft saved.");
  }

  async function doSubmit(data: FormData) {
    setSaveDraftMsg(null);
    setSubmitError(null);
    const result = await submitSiteVisitReport({ projectId, data: { ...(data as Record<string, string>), ...customValues } });
    if (result.error) setSubmitError(result.error);
    else router.push(`/projects/${projectId}`);
  }

  async function handleSubmit(data: FormData) {
    if (!timeLogged) { setShowTimePrompt(true); return; }
    await doSubmit(data);
  }

  async function onTimeSubmit(tData: any) {
    const result = await logTime({ projectId, userId, stage: "survey", hours_spent: parseFloat(tData.hours_spent), notes: tData.notes || null });
    if (result.error) setSubmitError(result.error);
    else setTimeLogged(true);
  }

  const F = form;

  if (isLocked) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-4">
        <LockKeyhole className="h-5 w-5 text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-700">Survey Submitted & Locked</p>
          <p className="text-xs text-green-600/80">This survey has been submitted. Contact your admin to re-open for corrections.</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <div className="space-y-4">

        {/* ── Pre-filled Lead Data ── */}
        <Card className="border-slate-200">
          <CardHeader className="py-3 px-4 pb-0 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-[#1e3a5f] font-semibold">
              Case Information (from Lead)
            </CardTitle>
            {!editingLead ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1.5 text-slate-500 hover:text-[#1e3a5f]"
                onClick={() => { setLeadSaveError(null); setEditingLead(true); }}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-slate-500"
                  onClick={() => { setEditingLead(false); setLeadSaveError(null); }}
                  disabled={savingLead}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-3 text-xs bg-[#1e3a5f] hover:bg-[#162d4a] text-white"
                  onClick={handleSaveLead}
                  disabled={savingLead}
                >
                  {savingLead ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-3 space-y-3">
            {!editingLead ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                  <ReadOnlyRow label="Code No." value={str(m.code_no)} />
                  <ReadOnlyRow label="Bank Name" value={str(project.bank_name)} />
                  <ReadOnlyRow label="Branch" value={str(m.branch)} />
                  <ReadOnlyRow label="Bank Manager" value={str(m.bank_manager_name)} />
                  <ReadOnlyRow label="Manager Mob." value={str(m.bank_manager_mob)} />
                  <ReadOnlyRow label="HLC / DSA" value={str(m.hlc_dsa_name)} />
                  <ReadOnlyRow label="HLC / DSA Mob." value={str(m.hlc_dsa_mob)} />
                  <ReadOnlyRow label="Owner" value={str(m.owner_name)} />
                  <ReadOnlyRow label="Owner Mob." value={str(m.owner_mob)} />
                  <ReadOnlyRow label="Proposed Owner" value={str(m.proposed_owner)} />
                  <ReadOnlyRow label="Proposed Owner Mob." value={str(m.proposed_owner_mob)} />
                  <ReadOnlyRow label="Property Type" value={str(m.property_type)} />
                </div>
                <div className="pt-1 border-t border-slate-100 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  <ReadOnlyRow label="Flat / House No." value={str(m.flat_house_no)} />
                  <ReadOnlyRow label="Building Name" value={str(m.building_name)} />
                  <ReadOnlyRow label="Plot No." value={str(m.plot_no)} />
                  <ReadOnlyRow label="Survey No." value={str(m.survey_no)} />
                  <div className="sm:col-span-2"><ReadOnlyRow label="Address" value={str(project.project_address)} /></div>
                  <ReadOnlyRow label="Landmark 1" value={str(m.landmark_1)} />
                  <ReadOnlyRow label="Landmark 2" value={str(m.landmark_2)} />
                  <ReadOnlyRow label="Loan Required" value={str(m.loan_required)} />
                  <ReadOnlyRow label="Tentative GPS" value={project.latitude && project.longitude ? `${project.latitude}, ${project.longitude}` : "—"} />
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-2">
                  Editing case details. Correct any mismatches and click Save Changes.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <EditField label="Bank Name" value={leadEdits.bank_name} onChange={setField("bank_name")} />
                  <EditField label="Branch" value={leadEdits.branch} onChange={setField("branch")} />
                  <EditField label="Bank Manager" value={leadEdits.bank_manager_name} onChange={setField("bank_manager_name")} />
                  <EditField label="Manager Mob." value={leadEdits.bank_manager_mob} onChange={setField("bank_manager_mob")} />
                  <EditField label="HLC / DSA" value={leadEdits.hlc_dsa_name} onChange={setField("hlc_dsa_name")} />
                  <EditField label="HLC / DSA Mob." value={leadEdits.hlc_dsa_mob} onChange={setField("hlc_dsa_mob")} />
                  <EditField label="Owner" value={leadEdits.owner_name} onChange={setField("owner_name")} />
                  <EditField label="Owner Mob." value={leadEdits.owner_mob} onChange={setField("owner_mob")} />
                  <EditField label="Proposed Owner" value={leadEdits.proposed_owner} onChange={setField("proposed_owner")} />
                  <EditField label="Proposed Owner Mob." value={leadEdits.proposed_owner_mob} onChange={setField("proposed_owner_mob")} />
                  <EditField label="Property Type" value={leadEdits.property_type} onChange={setField("property_type")} />
                  <EditField label="Flat / House No." value={leadEdits.flat_house_no} onChange={setField("flat_house_no")} />
                  <EditField label="Building Name" value={leadEdits.building_name} onChange={setField("building_name")} />
                  <EditField label="Plot No." value={leadEdits.plot_no} onChange={setField("plot_no")} />
                  <EditField label="Survey No." value={leadEdits.survey_no} onChange={setField("survey_no")} />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <EditField label="Address" value={leadEdits.project_address} onChange={setField("project_address")} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <EditField label="Landmark 1" value={leadEdits.landmark_1} onChange={setField("landmark_1")} />
                  <EditField label="Landmark 2" value={leadEdits.landmark_2} onChange={setField("landmark_2")} />
                  <EditField label="Loan Required" value={leadEdits.loan_required} onChange={setField("loan_required")} />
                </div>
                {leadSaveError && (
                  <p className="text-xs text-red-500">{leadSaveError}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Visit Details ── */}
        <Section title="Site Visit Details">
          <Row>
            <FormField control={F.control} name="visit_date" render={({ field }) => (
              <FormItem><FormLabel>Date of Visit</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div />
          </Row>
          <Row>
            <FormField control={F.control} name="person_met" render={({ field }) => (
              <FormItem><FormLabel>Person Met on Site</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={F.control} name="person_met_mob" render={({ field }) => (
              <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </Row>
          <Row>
            <FormField control={F.control} name="site_visit_by" render={({ field }) => (
              <FormItem><FormLabel>Site Visit Done By</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={F.control} name="site_visit_by_mob" render={({ field }) => (
              <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </Row>
        </Section>

        {/* ── Precise Location ── */}
        <Section title="Precise Location (on-site measurement)">
          <div className="flex items-center gap-2 flex-wrap">
            <FormField control={F.control} name="precise_latitude" render={({ field }) => (
              <FormItem className="flex-1 min-w-[120px]">
                <FormLabel>Latitude</FormLabel>
                <FormControl><Input type="number" step="any" placeholder="e.g. 18.520400" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={F.control} name="precise_longitude" render={({ field }) => (
              <FormItem className="flex-1 min-w-[120px]">
                <FormLabel>Longitude</FormLabel>
                <FormControl><Input type="number" step="any" placeholder="e.g. 73.856700" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="pt-5">
              <Button type="button" variant="outline" size="sm" onClick={handleGetLocation} disabled={locating} className="gap-1.5">
                <Locate className="h-3.5 w-3.5" />
                {locating ? "Locating…" : "Get My Location"}
              </Button>
            </div>
          </div>
          <Row>
            <FormField control={F.control} name="facing" render={({ field }) => (
              <FormItem>
                <FormLabel>Facing</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select direction" /></SelectTrigger></FormControl>
                  <SelectContent>{FACING_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </Row>
          <p className="text-xs text-slate-400 font-medium mt-1">Boundaries</p>
          <div className="grid grid-cols-2 gap-3">
            <FormField control={F.control} name="boundary_east" render={({ field }) => (
              <FormItem><FormLabel className="text-xs">East</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={F.control} name="boundary_west" render={({ field }) => (
              <FormItem><FormLabel className="text-xs">West</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={F.control} name="boundary_north" render={({ field }) => (
              <FormItem><FormLabel className="text-xs">North</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={F.control} name="boundary_south" render={({ field }) => (
              <FormItem><FormLabel className="text-xs">South</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          </div>
        </Section>

        {/* ── Property Dimensions ── */}
        <Section title="Property Dimensions">
          <Row>
            <FormField control={F.control} name="plot_area" render={({ field }) => (
              <FormItem><FormLabel>Plot Area</FormLabel><FormControl><Input placeholder="e.g. 100 sq.mt" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={F.control} name="carpet_area" render={({ field }) => (
              <FormItem><FormLabel>Carpet Area</FormLabel><FormControl><Input placeholder="e.g. 75 sq.mt" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </Row>
          <Row>
            <FormField control={F.control} name="builtup_area" render={({ field }) => (
              <FormItem><FormLabel>B/Up Area (Built-up)</FormLabel><FormControl><Input placeholder="e.g. 85 sq.mt" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </Row>
        </Section>

        {/* ── Property Details ── */}
        <Section title="Property Details">
          <Row>
            <FormField control={F.control} name="construction_stage" render={({ field }) => (
              <FormItem><FormLabel>Construction Stage</FormLabel><FormControl><Input placeholder="e.g. Completed / Under construction" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={F.control} name="use_of_property" render={({ field }) => (
              <FormItem><FormLabel>Use of Property</FormLabel><FormControl><Input placeholder="e.g. Residential / Commercial" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </Row>
          <Row>
            <FormField control={F.control} name="age_of_building" render={({ field }) => (
              <FormItem><FormLabel>Age of Building</FormLabel><FormControl><Input placeholder="e.g. 5 years" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={F.control} name="occupied_by" render={({ field }) => (
              <FormItem><FormLabel>Occupied By</FormLabel><FormControl><Input placeholder="e.g. Owner / Tenant / Vacant" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </Row>
        </Section>

        {/* ── Building Features ── */}
        <Section title="Building Features">
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
              <FormItem><FormLabel>No. of Rooms</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={F.control} name="no_of_toilets" render={({ field }) => (
              <FormItem><FormLabel>No. of Toilets</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={F.control} name="total_flats" render={({ field }) => (
              <FormItem><FormLabel>Total Flats</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={F.control} name="per_floor_flats" render={({ field }) => (
              <FormItem><FormLabel>Per Floor Flats</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={F.control} name="lift" render={({ field }) => (
              <FormItem>
                <FormLabel>Lift</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={F.control} name="parking" render={({ field }) => (
              <FormItem>
                <FormLabel>Parking</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>
          <FormField control={F.control} name="rcc_type" render={({ field }) => (
            <FormItem>
              <FormLabel>Construction Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select construction type" /></SelectTrigger></FormControl>
                <SelectContent>{RCC_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </Section>

        {/* ── Valuation Summary ── */}
        <Section title="Valuation Summary">
          <Row>
            <FormField control={F.control} name="nearby_rate" render={({ field }) => (
              <FormItem><FormLabel>Nearby / Recommended Rate</FormLabel><FormControl><Input placeholder="e.g. ₹5,000/sq.ft" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={F.control} name="valuation_method" render={({ field }) => (
              <FormItem>
                <FormLabel>Method Adopted</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                  <SelectContent>{VALUATION_METHODS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </Row>

          {/* Plot area valuation row */}
          <div className="rounded-md bg-slate-50 p-3 space-y-2">
            <p className="text-xs text-slate-500 font-medium">Plot Area</p>
            <div className="grid grid-cols-3 gap-2">
              <FormField control={F.control} name="plot_area_val" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Area</FormLabel><FormControl><Input placeholder="e.g. 100" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={F.control} name="plot_rate" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Rate (₹)</FormLabel><FormControl><Input placeholder="e.g. 5000" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={F.control} name="plot_valuation" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">= Rs.</FormLabel><FormControl><Input placeholder="e.g. 5,00,000" {...field} /></FormControl></FormItem>
              )} />
            </div>
          </div>

          {/* B/Up area valuation row */}
          <div className="rounded-md bg-slate-50 p-3 space-y-2">
            <p className="text-xs text-slate-500 font-medium">B/Up Area</p>
            <div className="grid grid-cols-3 gap-2">
              <FormField control={F.control} name="builtup_area_val" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Area</FormLabel><FormControl><Input placeholder="e.g. 85" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={F.control} name="builtup_rate" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Rate (₹)</FormLabel><FormControl><Input placeholder="e.g. 3000" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={F.control} name="builtup_valuation" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">= Rs.</FormLabel><FormControl><Input placeholder="e.g. 2,55,000" {...field} /></FormControl></FormItem>
              )} />
            </div>
          </div>

          <Row>
            <FormField control={F.control} name="extra_items" render={({ field }) => (
              <FormItem><FormLabel>Extra Items / Services (Rs.)</FormLabel><FormControl><Input placeholder="e.g. 10,000" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={F.control} name="final_valuation" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-[#1e3a5f]">Final Valuation Say (Rs.)</FormLabel>
                <FormControl><Input className="font-semibold border-[#1e3a5f]/30" placeholder="e.g. 7,65,000" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </Row>

          <FormField control={F.control} name="remark" render={({ field }) => (
            <FormItem>
              <FormLabel>Remark</FormLabel>
              <FormControl>
                <textarea
                  className="w-full min-h-[80px] border border-slate-200 rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
                  placeholder="Any observations or remarks…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </Section>

        {/* ── Additional Survey Fields ── */}
        {customFields.length > 0 && (
          <Section title="Additional Survey Fields">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customFields.map((cf) => (
                <div key={cf.key} className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">{cf.label}</label>
                  <Input
                    value={customValues[cf.key] || ""}
                    onChange={(e) => setCustomValues((prev) => ({ ...prev, [cf.key]: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Site Photos ── */}
        <Card className="border-slate-200">
          <CardHeader className="py-3 px-4 pb-0">
            <CardTitle className="text-sm text-[#1e3a5f] font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Site Photos
              <span className="text-xs font-normal text-slate-400">({totalPhotos}/{MAX_PHOTOS} · max {MAX_PHOTO_SIZE_MB}MB each)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-3 space-y-3">
            {/* Mandatory note */}
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2 border border-amber-200">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
              <span><strong>Mandatory:</strong> Upload at least one selfie taken at the property and one photo of the building / structure. These are required to complete the report.</span>
            </div>

            {/* Existing photos */}
            {visibleExisting.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-medium">Already uploaded</p>
                <div className="space-y-1">
                  {visibleExisting.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded px-3 py-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span className="truncate flex-1">{p.file_name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(p.id, true)}
                        disabled={deletingId === p.id}
                        className="shrink-0 p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                        title="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New photos added in this session */}
            {photosUploaded.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-medium">Uploaded this session</p>
                <div className="space-y-1">
                  {photosUploaded.map((photo) => (
                    <div key={photo.id} className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded px-3 py-2">
                      <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate flex-1">{photo.file_name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id, false)}
                        disabled={deletingId === photo.id}
                        className="shrink-0 p-0.5 rounded hover:bg-red-100 text-green-600/60 hover:text-red-500 transition-colors disabled:opacity-40"
                        title="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload */}
            {remaining > 0 ? (
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingCount > 0}
                >
                  <Camera className="h-4 w-4" />
                  {uploadingCount > 0 ? `Uploading ${uploadingCount} photo(s)…` : `Add Photos (${remaining} slot${remaining !== 1 ? "s" : ""} left)`}
                </Button>
                {uploadingCount > 0 && <Progress value={uploadProgress} className="h-2" />}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Maximum {MAX_PHOTOS} photos reached.
              </div>
            )}

            {uploadError && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded px-3 py-2">
                <X className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {uploadError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Log Time ── */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Log Time (optional)</CardTitle></CardHeader>
          <CardContent>
            {timeLogged ? (
              <div className="flex items-center gap-2 text-green-600 text-sm"><CheckCircle className="h-4 w-4" />Time logged</div>
            ) : (
              <Form {...timeForm}>
                <form onSubmit={timeForm.handleSubmit(onTimeSubmit)} className="space-y-4">
                  <FormField control={timeForm.control} name="hours_spent" render={({ field }) => (
                    <FormItem><FormLabel>Hours Spent</FormLabel><FormControl><Input type="number" step="0.5" min="0.5" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={timeForm.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#162d4a] text-white">Log Time</Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        {submitError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}
        {saveDraftMsg && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded px-4 py-2">
            <CheckCircle className="h-4 w-4" /> {saveDraftMsg}
          </div>
        )}

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
                <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => { setShowTimePrompt(false); form.handleSubmit(doSubmit)(); }}>
                  Skip &amp; Submit
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={form.handleSubmit(handleSaveDraft)}
            disabled={form.formState.isSubmitting}
          >
            Save Draft
          </Button>
          <Button
            type="button"
            className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={form.formState.isSubmitting}
          >
            Submit Report → Drafting
          </Button>
        </div>

      </div>
    </Form>
  );
}
