/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Printer, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  project: any;
  bankMetadata: Record<string, string>;
  report: Record<string, string>;
  photos: { id: string; file_name: string; signedUrl: string | null }[];
  creatorName: string;
}

function v(report: Record<string, string>, bm: Record<string, string>, key: string): string {
  return report[key] || bm[key] || "";
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2 px-3 border-b border-slate-100 last:border-0">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">{label}</div>
      <div className="text-sm text-slate-800 font-medium min-h-[18px]">
        {value || <span className="text-slate-300 font-normal">—</span>}
      </div>
    </div>
  );
}

function SectionHeading({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-1 first:mt-0">
      <div className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs font-bold flex items-center justify-center shrink-0">
        {n}
      </div>
      <h2 className="text-xs font-bold uppercase tracking-widest text-[#1e3a5f]">{children}</h2>
      <div className="flex-1 border-t border-[#1e3a5f]/20" />
    </div>
  );
}

function FieldGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div
      className="border border-slate-200 rounded-md overflow-hidden"
      style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {children}
    </div>
  );
}

export default function ValuationReportClient({ project, bankMetadata: bm, report: r, photos, creatorName }: Props) {
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const printDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const caseCode = bm.code_no || "—";
  const validPhotos = photos.filter((p) => p.signedUrl && !imgErrors.has(p.id));

  return (
    <>
      {/* Print isolation — hides everything except the report */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #valuation-report, #valuation-report * { visibility: visible; }
          #valuation-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            font-size: 12px;
          }
          @page {
            size: A4;
            margin: 12mm 14mm;
          }
        }
      `}</style>

      {/* Screen-only controls */}
      <div className="print:hidden mb-4 flex items-center gap-3 flex-wrap">
        <Link href={`/projects/${project.id}`}>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Case
          </Button>
        </Link>
        <Button
          onClick={() => window.print()}
          className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white gap-2 text-sm"
        >
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </Button>
        <span className="text-xs text-slate-400">In the print dialog, choose &ldquo;Save as PDF&rdquo; to download.</span>
      </div>

      {/* ── Valuation Report ── */}
      <div
        id="valuation-report"
        className="bg-white"
        style={{ maxWidth: "800px", fontFamily: "system-ui, Arial, sans-serif" }}
      >
        {/* Document Header */}
        <div
          className="flex items-start justify-between gap-4 pb-3 mb-4"
          style={{ borderBottom: "2.5px solid #1e3a5f" }}
        >
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
              Nabhangan Engineers
            </div>
            <h1 className="text-2xl font-extrabold text-[#1e3a5f] leading-tight">
              VALUATION REPORT
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Property Valuation &amp; Survey Report</p>
          </div>
          <div className="text-right text-xs text-slate-500 shrink-0 space-y-0.5">
            <p>Date: <strong className="text-slate-700">{printDate}</strong></p>
            <p>Case: <strong className="text-slate-700">{caseCode}</strong></p>
            {creatorName && <p>Officer: <strong className="text-slate-700">{creatorName}</strong></p>}
          </div>
        </div>

        {/* 1 — Bank / Case Info */}
        <SectionHeading n={1}>Bank / Case Information</SectionHeading>
        <FieldGrid cols={3}>
          <Field label="Code No." value={bm.code_no} />
          <Field label="Bank Name" value={project.bank_name} />
          <Field label="Branch" value={bm.branch} />
          <Field label="Bank Manager" value={bm.bank_manager_name} />
          <Field label="Manager Mobile" value={bm.bank_manager_mob} />
          <Field label="Loan Required" value={bm.loan_required} />
          <Field label="HLC / DSA Name" value={bm.hlc_dsa_name} />
          <Field label="HLC / DSA Mobile" value={bm.hlc_dsa_mob} />
          <Field label="" value="" />
        </FieldGrid>

        {/* 2 — Owner Details */}
        <SectionHeading n={2}>Owner Details</SectionHeading>
        <FieldGrid cols={2}>
          <Field label="Name of Owner" value={v(r, bm, "owner_name")} />
          <Field label="Owner Mobile" value={v(r, bm, "owner_mob")} />
          <Field label="Proposed Owner" value={v(r, bm, "proposed_owner")} />
          <Field label="Proposed Owner Mobile" value={v(r, bm, "proposed_owner_mob")} />
        </FieldGrid>

        {/* 3 — Property Address */}
        <SectionHeading n={3}>Property Address</SectionHeading>
        <FieldGrid cols={2}>
          <Field label="Type of Property" value={v(r, bm, "property_type")} />
          <Field label="Flat / House No." value={v(r, bm, "flat_house_no")} />
          <Field label="Building Name" value={v(r, bm, "building_name")} />
          <Field label="Plot No." value={v(r, bm, "plot_no")} />
          <Field label="Survey No. (S.No.)" value={v(r, bm, "survey_no")} />
          <Field label="" value="" />
        </FieldGrid>
        <div className="border border-slate-200 rounded-md mt-1">
          <Field label="Full Property Address" value={project.project_address} />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
          >
            <Field label="Landmark 1" value={v(r, bm, "landmark_1")} />
            <Field label="Landmark 2" value={v(r, bm, "landmark_2")} />
          </div>
        </div>

        {/* 4 — Site Visit Details */}
        <SectionHeading n={4}>Site Visit Details</SectionHeading>
        <FieldGrid cols={2}>
          <Field label="Date of Site Visit" value={r.visit_date} />
          <Field label="GPS Coordinates" value={
            r.precise_latitude && r.precise_longitude
              ? `${r.precise_latitude}, ${r.precise_longitude}`
              : (project.latitude && project.longitude ? `${project.latitude}, ${project.longitude}` : "")
          } />
          <Field label="Person Met on Site" value={v(r, bm, "person_met")} />
          <Field label="Person Met Mobile" value={v(r, bm, "person_met_mob")} />
          <Field label="Site Visit Conducted By" value={v(r, bm, "site_visit_by")} />
          <Field label="Surveyor Mobile" value={v(r, bm, "site_visit_by_mob")} />
        </FieldGrid>

        {/* 5 — Property Dimensions */}
        <SectionHeading n={5}>Property Dimensions</SectionHeading>
        <FieldGrid cols={3}>
          <Field label="Plot Area" value={v(r, bm, "plot_area")} />
          <Field label="Carpet Area" value={v(r, bm, "carpet_area")} />
          <Field label="Built-up Area" value={v(r, bm, "builtup_area")} />
        </FieldGrid>

        {/* 6 — Property Details */}
        <SectionHeading n={6}>Property Details</SectionHeading>
        <FieldGrid cols={2}>
          <Field label="Construction Stage" value={v(r, bm, "construction_stage")} />
          <Field label="Use of Property" value={v(r, bm, "use_of_property")} />
          <Field label="Age of Building" value={v(r, bm, "age_of_building")} />
          <Field label="Occupied By" value={v(r, bm, "occupied_by")} />
        </FieldGrid>

        {/* 7 — Building Features */}
        <SectionHeading n={7}>Building Features</SectionHeading>
        <FieldGrid cols={4}>
          <Field label="Total Floors" value={v(r, bm, "total_floors")} />
          <Field label="Property Floor" value={v(r, bm, "property_floor")} />
          <Field label="Road Width" value={v(r, bm, "road_width")} />
          <Field label="No. of Rooms" value={v(r, bm, "no_of_rooms")} />
          <Field label="No. of Toilets" value={v(r, bm, "no_of_toilets")} />
          <Field label="Total Flats" value={v(r, bm, "total_flats")} />
          <Field label="Per Floor Flats" value={v(r, bm, "per_floor_flats")} />
          <Field label="Lift" value={v(r, bm, "lift")} />
          <Field label="Parking" value={v(r, bm, "parking")} />
          <Field label="Construction Type" value={v(r, bm, "rcc_type")} />
          <Field label="" value="" />
          <Field label="" value="" />
        </FieldGrid>

        {/* 8 — Facing & Boundaries */}
        <SectionHeading n={8}>Facing &amp; Boundaries</SectionHeading>
        <FieldGrid cols={4}>
          <Field label="Facing Direction" value={v(r, bm, "facing")} />
          <Field label="" value="" />
          <Field label="" value="" />
          <Field label="" value="" />
          <Field label="East Boundary" value={v(r, bm, "boundary_east")} />
          <Field label="West Boundary" value={v(r, bm, "boundary_west")} />
          <Field label="North Boundary" value={v(r, bm, "boundary_north")} />
          <Field label="South Boundary" value={v(r, bm, "boundary_south")} />
        </FieldGrid>

        {/* 9 — Valuation Summary */}
        <SectionHeading n={9}>Valuation Summary</SectionHeading>
        <FieldGrid cols={2}>
          <Field label="Nearby / Recommended Rate" value={v(r, bm, "nearby_rate")} />
          <Field label="Method Adopted" value={v(r, bm, "valuation_method")} />
        </FieldGrid>
        <div className="border border-slate-200 rounded-md mt-1 overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Item</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Area</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Rate (₹)</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2 text-slate-700">Plot</td>
                <td className="px-3 py-2 text-right text-slate-600">{r.plot_area_val || "—"}</td>
                <td className="px-3 py-2 text-right text-slate-600">{r.plot_rate || "—"}</td>
                <td className="px-3 py-2 text-right text-slate-600">{r.plot_valuation || "—"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2 text-slate-700">Built-up Area</td>
                <td className="px-3 py-2 text-right text-slate-600">{r.builtup_area_val || "—"}</td>
                <td className="px-3 py-2 text-right text-slate-600">{r.builtup_rate || "—"}</td>
                <td className="px-3 py-2 text-right text-slate-600">{r.builtup_valuation || "—"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2 text-slate-700" colSpan={3}>Extra Items / Services</td>
                <td className="px-3 py-2 text-right text-slate-600">{r.extra_items || "—"}</td>
              </tr>
              <tr style={{ background: "#eff6ff" }}>
                <td className="px-3 py-3 font-bold text-[#1e3a5f] text-base" colSpan={3}>
                  Final Valuation Say (Rs.)
                </td>
                <td className="px-3 py-3 text-right font-bold text-[#1e3a5f] text-base">
                  {r.final_valuation || "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 10 — Remarks */}
        {r.remark && (
          <>
            <SectionHeading n={10}>Remarks</SectionHeading>
            <div className="border border-slate-200 rounded-md px-3 py-2.5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {r.remark}
            </div>
          </>
        )}

        {/* 11 — Site Photos */}
        {validPhotos.length > 0 && (
          <>
            <SectionHeading n={r.remark ? 11 : 10}>Site Photos</SectionHeading>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}
            >
              {validPhotos.map((photo) => (
                <div
                  key={photo.id}
                  style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.signedUrl!}
                    alt={photo.file_name}
                    onError={() => setImgErrors((prev) => new Set(prev).add(photo.id))}
                    style={{ width: "100%", height: "150px", objectFit: "cover", display: "block" }}
                  />
                  <p style={{ fontSize: "9px", color: "#94a3b8", padding: "2px 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {photo.file_name}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between mt-8 pt-3"
          style={{ borderTop: "1px solid #e2e8f0", fontSize: "10px", color: "#94a3b8" }}
        >
          <span>© 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions. All rights reserved.</span>
          <span>Generated on {printDate}</span>
        </div>

        {/* Signature strip */}
        <div
          className="grid gap-12 mt-10"
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          <div className="text-center">
            <div style={{ borderTop: "1px solid #94a3b8", paddingTop: "4px", fontSize: "11px", color: "#64748b" }}>
              Surveyor / Prepared By
            </div>
          </div>
          <div className="text-center">
            <div style={{ borderTop: "1px solid #94a3b8", paddingTop: "4px", fontSize: "11px", color: "#64748b" }}>
              Authorised Signatory
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
