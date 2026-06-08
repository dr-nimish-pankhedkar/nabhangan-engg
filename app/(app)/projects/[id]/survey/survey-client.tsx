/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ChecklistTemplate } from "@/lib/types";
import { uploadProjectFile } from "@/lib/storage";
import { submitChecklist, logFileRecord, advanceStage } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Upload } from "lucide-react";

export default function SurveyStageClient({
  projectId,
  userId,
  templates,
}: {
  projectId: string;
  userId: string;
  templates: ChecklistTemplate[];
}) {
  const router = useRouter();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, reset } = useForm();

  const template = templates[0];

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(10);
    try {
      setUploadProgress(40);
      const url = await uploadProjectFile(projectId, "survey", file);
      setUploadProgress(80);
      await logFileRecord({
        projectId,
        userId,
        stage: "survey",
        filePath: url,
        fileName: file.name,
        fileType: file.type,
      });
      setUploadProgress(100);
      setUploadedFile(file.name);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: any) {
    if (!template) return;
    setError(null);
    const result = await submitChecklist({
      projectId,
      userId,
      templateId: template.id,
      stage: "survey",
      responses: data,
      remarks: data._remarks || null,
    });
    if (result.error) {
      setError(result.error);
    } else {
      setSubmitted(true);
      reset();
    }
  }

  async function handleAdvance() {
    setAdvanceError(null);
    setAdvancing(true);
    const result = await advanceStage(projectId, "drafting");
    if (result.error) {
      setAdvanceError(result.error);
      setAdvancing(false);
    } else {
      router.push(`/projects/${projectId}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Upload Survey File</CardTitle>
        </CardHeader>
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
              <CheckCircle className="h-4 w-4" />
              {uploadedFile} uploaded
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      {/* Checklist */}
      {template ? (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{template.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                Checklist submitted successfully
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {template.fields.map((field, idx) => (
                  <div key={idx} className="space-y-1">
                    <Label htmlFor={`field_${idx}`}>
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </Label>
                    {field.type === "boolean" ? (
                      <input
                        type="checkbox"
                        id={`field_${idx}`}
                        {...register(`field_${idx}`)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    ) : field.type === "select" && field.options ? (
                      <select
                        id={`field_${idx}`}
                        {...register(`field_${idx}`, { required: field.required })}
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="">Select…</option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={`field_${idx}`}
                        type={field.type === "number" ? "number" : "text"}
                        {...register(`field_${idx}`, { required: field.required })}
                      />
                    )}
                  </div>
                ))}
                <div className="space-y-1">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Input id="remarks" {...register("_remarks")} />
                </div>
                <Button type="submit" className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#162d4a] text-white">
                  Submit Checklist
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200">
          <CardContent className="py-4">
            <p className="text-sm text-slate-500">No checklist template for survey stage.</p>
          </CardContent>
        </Card>
      )}

      {advanceError && <p className="text-sm text-red-500">{advanceError}</p>}

      <Button onClick={handleAdvance} disabled={advancing} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#162d4a] text-white">
        {advancing ? "Advancing…" : "Mark Survey Complete → Drafting"}
      </Button>
    </div>
  );
}
