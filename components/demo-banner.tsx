/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

import { AlertTriangle, Phone } from "lucide-react";
import { DEMO_EXPIRY } from "@/lib/demo";

const expiryLabel = DEMO_EXPIRY.toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

export default function DemoBanner({ daysLeft, expired }: { daysLeft: number; expired: boolean }) {
  if (expired) {
    return null; // Full-screen block is rendered in layout; this slot is unused when expired
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-xs font-medium shrink-0">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>
        <strong>Free Trial Version</strong> — valid till {expiryLabel}, licensed to use for <strong>Nabhangan Engineers</strong>. Contact Dr. Nimish Pankhedkar, Chemiligence Solutions to purchase the full version.
      </span>
    </div>
  );
}

export function TrialExpiredBlock() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Trial Period Expired</h1>
      <p className="text-slate-500 text-sm max-w-sm mb-8">
        Your free trial has ended. Please contact us to activate the full version and restore access.
      </p>
      <div className="space-y-3 w-full max-w-xs">
        <a
          href="tel:+917767814424"
          className="flex items-center justify-center gap-2.5 w-full rounded-lg bg-[#1e3a5f] hover:bg-[#162d4a] text-white px-4 py-3 text-sm font-semibold transition-colors"
        >
          <Phone className="h-4 w-4" />
          Dr. Nimish Pankhedkar — +91-7767814424
        </a>
        <a
          href="tel:+918390473349"
          className="flex items-center justify-center gap-2.5 w-full rounded-lg border border-[#1e3a5f] text-[#1e3a5f] hover:bg-slate-50 px-4 py-3 text-sm font-semibold transition-colors"
        >
          <Phone className="h-4 w-4" />
          Mr. Ankit Jain — +91-8390473349
        </a>
      </div>
      <p className="mt-8 text-xs text-slate-400">
        © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
      </p>
    </div>
  );
}
