/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { Loader2 } from "lucide-react";

export default function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin text-[#1e3a5f]" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
