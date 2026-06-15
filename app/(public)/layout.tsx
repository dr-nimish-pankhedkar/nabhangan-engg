/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
        <div className="h-7 w-7 rounded-md bg-[#1e3a5f] flex items-center justify-center">
          <span className="text-white text-xs font-bold">N</span>
        </div>
        <span className="font-semibold text-slate-800 text-sm">Nabhangan Engineers</span>
      </header>
      <main className="flex-1 p-4 md:p-8">{children}</main>
      <footer className="border-t border-slate-200 px-6 py-3 text-center text-xs text-slate-400">
        © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions. All rights reserved.
      </footer>
    </div>
  );
}
