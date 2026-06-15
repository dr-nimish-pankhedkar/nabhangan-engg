/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface RefFile {
  id: string;
  file_name: string;
  stage: string;
  signedUrl: string | null;
}

const STAGE_LABEL: Record<string, string> = {
  survey: "Survey",
  rate_verification: "Rate Verif.",
  drafting: "Drafting",
  checking: "Checking",
  print: "Print",
  scan: "Scan",
};

export default function ReferenceFiles({ files }: { files: RefFile[] }) {
  if (files.length === 0) return null;
  return (
    <Card className="border-blue-100 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#1e3a5f]" />
          Reference Files
          <span className="text-xs font-normal text-slate-400">from previous stages — valid 1 hr</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {files.map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-3 bg-white rounded-md px-3 py-2.5 border border-blue-100">
            <div className="min-w-0">
              <p className="text-sm text-slate-700 truncate font-medium">{f.file_name}</p>
              <p className="text-[10px] text-slate-400">{STAGE_LABEL[f.stage] || f.stage}</p>
            </div>
            {f.signedUrl ? (
              <a
                href={f.signedUrl}
                download={f.file_name}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1e3a5f] text-white rounded-md hover:bg-[#162d4a] transition-colors shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            ) : (
              <span className="text-xs text-slate-400 shrink-0 italic">Link unavailable</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
