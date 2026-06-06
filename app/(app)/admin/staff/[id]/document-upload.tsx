/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DOC_TYPES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle } from "lucide-react";
import { uploadStaffDocument } from "./actions";

export default function StaffDocumentUpload({ staffId, adminId }: { staffId: string; adminId: string }) {
  const router = useRouter();
  const [docType, setDocType] = useState("id_proof");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("staffId", staffId);
    formData.append("adminId", adminId);
    formData.append("docType", docType);
    try {
      const result = await uploadStaffDocument(formData);
      if (result?.error) setError(result.error);
      else { setDone(true); router.refresh(); }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border border-dashed border-slate-200 rounded-md p-3 space-y-2">
      <p className="text-xs font-medium text-slate-600">Upload Document</p>
      <Select value={docType} onValueChange={setDocType}>
        <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {DOC_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
      <Button variant="outline" size="sm" className="gap-1 text-xs w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
        <Upload className="h-3 w-3" />{uploading ? "Uploading…" : "Choose File"}
      </Button>
      {done && <div className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3 w-3" />Uploaded</div>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
