/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

export default function ReportsLoading() {
  return (
    <div className="max-w-4xl animate-pulse">
      <div className="h-7 w-32 bg-slate-200 rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-md" />
          ))}
        </div>
        <div className="md:col-span-2 space-y-4">
          <div className="h-8 bg-slate-100 rounded" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg" />
            ))}
          </div>
          <div className="h-48 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
