/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

interface CaseInfo {
  branch?: string;
  bank_manager_name?: string;
  bank_manager_mob?: string;
  owner_name?: string;
  owner_mob?: string;
  project_address?: string;
}

export default function CaseInfoPopover({ info }: { info: CaseInfo }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const hasInfo = info.branch || info.bank_manager_name || info.owner_name || info.project_address;
  if (!hasInfo) return null;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="align-middle text-slate-300 hover:text-[#1e3a5f] transition-colors p-0.5 rounded"
        title="Show case details"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-3 w-56 space-y-2 text-xs">
          {info.branch && (
            <div>
              <p className="text-slate-400 leading-none mb-0.5">Branch</p>
              <p className="text-slate-700 font-medium">{info.branch}</p>
            </div>
          )}
          {info.bank_manager_name && (
            <div>
              <p className="text-slate-400 leading-none mb-0.5">Bank Manager</p>
              <p className="text-slate-700 font-medium">
                {info.bank_manager_name}
                {info.bank_manager_mob && (
                  <span className="font-normal text-slate-500"> · {info.bank_manager_mob}</span>
                )}
              </p>
            </div>
          )}
          {info.owner_name && (
            <div>
              <p className="text-slate-400 leading-none mb-0.5">Owner</p>
              <p className="text-slate-700 font-medium">
                {info.owner_name}
                {info.owner_mob && (
                  <span className="font-normal text-slate-500"> · {info.owner_mob}</span>
                )}
              </p>
            </div>
          )}
          {info.project_address && (
            <div>
              <p className="text-slate-400 leading-none mb-0.5">Address</p>
              <p className="text-slate-700">{info.project_address}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
