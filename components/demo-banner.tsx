/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { AlertTriangle } from "lucide-react";

export default function DemoBanner({ daysLeft, expired }: { daysLeft: number; expired: boolean }) {
  if (expired) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-medium shrink-0">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>
          Demo version has <strong>expired</strong>. Please contact Dr. Nimish Pankhedkar, Chemiligence Solutions to activate the full version.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-xs font-medium shrink-0">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>
        <strong>Demo Version</strong> — expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""} (20 Jun 2026). Contact Dr. Nimish Pankhedkar, Chemiligence Solutions to purchase the full version.
      </span>
    </div>
  );
}
