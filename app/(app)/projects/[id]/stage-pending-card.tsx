/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { Clock } from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  lead: "New Case (Pending Admin)",
  survey: "Site Survey",
  rate_verification: "Rate Verification",
  drafting: "Drafting",
  checking: "Checking",
  print: "Printing",
  scan: "Scanning",
  dispatch: "Dispatch",
  fees_received: "Fees Received",
};

export default function StagePendingCard({
  activeStage,
  assignedTo,
}: {
  activeStage: string;
  assignedTo: string | null;
}) {
  const label = STAGE_LABELS[activeStage] ?? activeStage;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
      <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800">Previous stage not yet complete</p>
        <p className="text-xs text-amber-700 mt-1">
          This project is currently at the{" "}
          <span className="font-medium">{label}</span> stage
          {assignedTo ? (
            <>, pending with <span className="font-medium">{assignedTo}</span></>
          ) : (
            " (currently unassigned)"
          )}
          . Your stage will unlock once they submit their work.
        </p>
      </div>
    </div>
  );
}
