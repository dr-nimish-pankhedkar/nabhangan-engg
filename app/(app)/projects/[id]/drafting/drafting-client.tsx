/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { uploadProjectFile } from "@/lib/storage";
import { logFileRecord, logTime, advanceStage } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Upload, Download, Camera, ExternalLink, LockKeyhole, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

const timeSchema = z.object({
  hours_spent: z.string().min(1).refine((v) => parseFloat(v) > 0, "Must be > 0"),
  notes: z.string().optional(),
});

interface SurveyPhoto {
  id: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  signedUrl: string | null;
  profiles?: { full_name: string } | null;
}

export default function DraftingClient({
  projectId,
  userId,
  surveyPhotos,
  siteVisitData,
  isLocked,
}: {
  projectId: string;
  userId: string;
  surveyPhotos: SurveyPhoto[];
  siteVisitData: Record<string, string> | null;
  isLocked: boolean;
}) {
  const router = useRouter();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [timeLogged, setTimeLogged] = useState(false);
  const [showTimePrompt, setShowTimePrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm({ resolver: zodResolver(timeSchema), defaultValues: { hours_spent: "", notes: "" } });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(10);
    try {
      setUploadProgress(40);
      const url = await uploadProjectFile(projectId, "drafting", file);
      setUploadProgress(80);
      await logFileRecord({ projectId, userId, stage: "drafting", filePath: url, fileName: file.name, fileType: file.type });
      setUploadProgress(100);
      setUploadedFile(file.name);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function onTimeSubmit(data: any) {
    const result = await logTime({ projectId, userId, stage: "drafting", hours_spent: parseFloat(data.hours_spent), notes: data.notes || null });
    if (result.error) setError(result.error);
    else setTimeLogged(true);
  }

  async function doAdvance() {
    const result = await advanceStage(projectId, "checking");
    if (result.error) setError(result.error);
    else router.push(`/projects/${projectId}`);
  }

  async function handleAdvance() {
    if (!timeLogged) { setShowTimePrompt(true); return; }
    await doAdvance();
  }

  const sv = siteVisitData;

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

      {/* ── Survey Photos from Site Visit ── */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Camera className="h-4 w-4 text-[#1e3a5f]" />
            Site Visit Photos
            <span className="text-xs font-normal text-slate-400">({surveyPhotos.length} photo{surveyPhotos.length !== 1 ? "s" : ""})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {surveyPhotos.length === 0 ? (
            <p className="text-sm text-slate-400">No photos were uploaded during the site visit.</p>
          ) : (
            <>
              <p className="text-xs text-slate-400 mb-2">Download links are valid for 1 hour. Refresh the page to generate new links.</p>
              <div className="space-y-2">
                {surveyPhotos.map((photo, idx) => (
                  <div key={photo.id} className="flex items-center justify-between gap-3 bg-slate-50 rounded-md px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 font-medium truncate">
                        Photo {idx + 1} — {photo.file_name}
                      </p>
                      {photo.profiles?.full_name && (
                        <p className="text-xs text-slate-400">by {photo.profiles.full_name}</p>
                      )}
                    </div>
                    {photo.signedUrl ? (
                      <a
                        href={photo.signedUrl}
                        download={photo.file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1e3a5f] text-white rounded-md hover:bg-[#162d4a] transition-colors shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 shrink-0">Link unavailable</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Site Visit Summary (key data for draughtsman) ── */}
      {sv && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Site Visit Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
              {[
                ["Visit Date", sv.visit_date],
                ["Plot Area", sv.plot_area],
                ["Carpet Area", sv.carpet_area],
                ["B/Up Area", sv.builtup_area],
                ["Construction Stage", sv.construction_stage],
                ["Use of Property", sv.use_of_property],
                ["Age of Building", sv.age_of_building],
                ["Occupied By", sv.occupied_by],
                ["Total Floors", sv.total_floors],
                ["Property Floor", sv.property_floor],
                ["No. of Rooms", sv.no_of_rooms],
                ["No. of Toilets", sv.no_of_toilets],
                ["Lift", sv.lift],
                ["Parking", sv.parking],
                ["Road Width", sv.road_width],
                ["Construction Type", sv.rcc_type],
                ["Facing", sv.facing],
                ["Precise GPS", sv.precise_latitude && sv.precise_longitude ? `${sv.precise_latitude}, ${sv.precise_longitude}` : ""],
                ["Nearby Rate", sv.nearby_rate],
                ["Final Valuation", sv.final_valuation],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-slate-700 font-medium">{value}</span>
                </div>
              ))}
            </div>
            {sv.remark && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">Remark: </span>
                <span className="text-xs text-slate-700">{sv.remark}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Upload Drafting File ── */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3"><CardTitle className="text-sm">Upload Drafting File</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
          <Button
            variant="outline"
            className="w-full sm:w-auto gap-2"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Choose File"}
          </Button>
          {uploading && <Progress value={uploadProgress} className="h-2" />}
          {uploadedFile && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />{uploadedFile} uploaded
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Log Time ── */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3"><CardTitle className="text-sm">Log Time</CardTitle></CardHeader>
        <CardContent>
          {timeLogged ? (
            <div className="flex items-center gap-2 text-green-600 text-sm"><CheckCircle className="h-4 w-4" />Time logged</div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onTimeSubmit)} className="space-y-4">
                <FormField control={form.control} name="hours_spent" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours Spent</FormLabel>
                    <FormControl><Input type="number" step="0.5" min="0.5" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#162d4a] text-white">Log Time</Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

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
        Mark Drafting Complete → Checking
      </Button>
    </div>
  );
}
