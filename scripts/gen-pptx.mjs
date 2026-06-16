import PptxGenJS from "pptxgenjs";

const NAVY = "1e3a5f";
const TEAL = "0f766e";
const PURPLE = "7e22ce";
const WHITE = "FFFFFF";
const LIGHT = "f1f5f9";
const SLATE = "64748b";
const DARK = "1e293b";

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5

// ─── helpers ───────────────────────────────────────────────────────────────

function addTitle(slide, text, sub) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 7.5, fill: { color: NAVY } });
  slide.addText(text, {
    x: 1.2, y: 2.6, w: 10.9, h: 1.0,
    fontSize: 36, bold: true, color: WHITE, align: "center",
  });
  if (sub) {
    slide.addText(sub, {
      x: 1.2, y: 3.8, w: 10.9, h: 0.5,
      fontSize: 16, color: "93c5fd", align: "center",
    });
  }
  slide.addText("Chemiligence Solutions · Licensed to Nabhangan Engineers", {
    x: 0, y: 6.9, w: "100%", h: 0.4,
    fontSize: 10, color: "93c5fd", align: "center",
  });
}

function addSlideHeader(slide, title, color) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.9, fill: { color: color || NAVY } });
  slide.addText(title, {
    x: 0.4, y: 0.1, w: 12.5, h: 0.7,
    fontSize: 20, bold: true, color: WHITE,
  });
  slide.addText("Nabhangan Engineers — Workflow Tracker", {
    x: 0, y: 7.1, w: "100%", h: 0.3,
    fontSize: 9, color: SLATE, align: "center",
  });
}

function bulletBox(slide, x, y, w, h, heading, items, color) {
  const c = color || NAVY;
  slide.addShape(pptx.ShapeType.rect, { x, y, w, h: 0.32, fill: { color: c } });
  slide.addText(heading.toUpperCase(), {
    x: x + 0.08, y: y, w: w - 0.1, h: 0.32,
    fontSize: 8.5, bold: true, color: WHITE,
  });
  const rows = items.map((t) => ({ text: "✓  " + t, options: { fontSize: 9.5, color: DARK, bullet: false } }));
  slide.addText(rows, {
    x: x + 0.08, y: y + 0.34, w: w - 0.16, h: h - 0.38,
    valign: "top", paraSpaceAfter: 3,
  });
  slide.addShape(pptx.ShapeType.rect, { x, y: y + 0.32, w, h: h - 0.32,
    fill: { color: "ffffff" }, line: { color: "e2e8f0", width: 0.5 } });
}

// ─── Slide 1: Cover ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addTitle(s, "Platform Features & Capabilities", "Nabhangan Engineers — Project & Workflow Tracker");
  s.addText("A SaaS product by Chemiligence Solutions", {
    x: 0, y: 4.5, w: "100%", h: 0.4,
    fontSize: 13, color: "bfdbfe", align: "center", italic: true,
  });
}

// ─── Slide 2: Workflow Overview ─────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addSlideHeader(s, "8-Stage Case Workflow");

  const stages = ["Lead", "Survey", "Rate\nVerif.", "Drafting", "Checking", "Print", "Scan", "Dispatch"];
  const startX = 0.3;
  const boxW = 1.38;
  const boxH = 1.1;
  const y = 2.4;
  const gap = 0.14;

  stages.forEach((label, i) => {
    const x = startX + i * (boxW + gap);
    s.addShape(pptx.ShapeType.rect, { x, y, w: boxW, h: boxH, fill: { color: NAVY }, rectRadius: 0.1 });
    s.addText(String(i + 1), { x, y: y + 0.08, w: boxW, h: 0.35, fontSize: 18, bold: true, color: "93c5fd", align: "center" });
    s.addText(label, { x, y: y + 0.52, w: boxW, h: 0.5, fontSize: 10, bold: true, color: WHITE, align: "center" });
    if (i < stages.length - 1) {
      s.addShape(pptx.ShapeType.rect, { x: x + boxW, y: y + 0.48, w: gap, h: 0.14, fill: { color: "94a3b8" } });
    }
  });

  s.addText("Each stage is tracked separately. Staff are assigned per stage. The case advances only when the current stage is submitted and the admin approves.", {
    x: 0.5, y: 4.0, w: 12.3, h: 0.6,
    fontSize: 11, color: SLATE, align: "center",
  });

  const highlights = [
    "Role-based access — each person sees only their stage",
    "Auto-advance on third-party survey submission",
    "Admin can revoke any stage for correction",
    "All timestamps recorded in Indian Standard Time (IST)",
  ];
  highlights.forEach((t, i) => {
    s.addText("• " + t, { x: 1.5, y: 4.8 + i * 0.38, w: 10, h: 0.34, fontSize: 11, color: DARK });
  });
}

// ─── Slide 3: Owner Features (1) ───────────────────────────────────────────
{
  const s = pptx.addSlide();
  addSlideHeader(s, "Owner / Administrator Features");

  const col1x = 0.3, col2x = 6.9, colW = 6.3;

  bulletBox(s, col1x, 1.05, colW, 1.55, "Dashboard & Overview", [
    "Live case count across all 8 workflow stages",
    "Realtime Occupancy — staff on currently active work",
    "Third-party surveyor tracking with link status",
    "IST-personalised greeting",
  ], NAVY);

  bulletBox(s, col2x, 1.05, colW, 1.55, "Case Management", [
    "Create cases with bank, owner & property details",
    "Add custom survey fields per case at lead stage",
    "Edit case info at any time; delete (admin only)",
    "Mark documents pending; approve flagged cases",
  ], NAVY);

  bulletBox(s, col1x, 2.72, colW, 1.55, "Staff Assignment", [
    "Assign staff to any of the 8 workflow stages",
    "Visual assignment matrix — all cases × all staff",
    "Assign non-project 'Other Tasks' to any staff",
    "Generate secure third-party survey links",
  ], NAVY);

  bulletBox(s, col2x, 2.72, colW, 1.55, "Stage Control", [
    "Advance case to next stage when ready",
    "Revoke submitted stage for correction",
    "Auto-advance when third-party survey submitted",
    "Visual progress stepper on every case",
  ], NAVY);

  bulletBox(s, col1x, 4.39, colW, 1.45, "Activity & Timeline", [
    "Activity History: files, time logs, third-party submissions",
    "Project Timeline: staff, hours & submission timestamps",
    "Lead creation date shown; all timestamps in IST",
    "Download Timeline as CSV",
  ], NAVY);

  bulletBox(s, col2x, 4.39, colW, 1.45, "Account & Security", [
    "Secure login with Supabase authentication",
    "Change password with current password verification",
    "Role-based access — admin sees all, staff sees own work",
    "Session-protected routes throughout",
  ], NAVY);
}

// ─── Slide 4: Owner Features (2) ───────────────────────────────────────────
{
  const s = pptx.addSlide();
  addSlideHeader(s, "Owner / Administrator — Reports & Admin Modules");

  const col1x = 0.3, col2x = 6.9, colW = 6.3;

  bulletBox(s, col1x, 1.05, colW, 1.9, "Site Survey Report (PDF)", [
    "Printable PDF with Nabhangan Engineers logo",
    "Bank info, owner, property address, site visit details",
    "GPS coordinates from on-site measurement",
    "Property dimensions, building features & valuation summary",
    "Custom project-specific fields in a dedicated section",
    "Site photos embedded (up to 10)",
    "Signature strip and Chemiligence copyright footer",
  ], NAVY);

  bulletBox(s, col2x, 1.05, colW, 1.9, "Admin Modules", [
    "Staff directory — add, edit, activate / deactivate",
    "Assignments panel — stage allocation for all active cases",
    "Other Tasks — assign non-project work to staff",
    "Third-Party Survey Link generator with custom expiry",
    "Task Requests — approve or reject staff-raised requests",
    "Reports module for business analytics",
  ], NAVY);

  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 3.15, w: 12.9, h: 0.32, fill: { color: "dbeafe" } });
  s.addText("CUSTOM SURVEY FIELDS — How it works", {
    x: 0.5, y: 3.15, w: 12.5, h: 0.32,
    fontSize: 9.5, bold: true, color: NAVY,
  });

  const steps = [
    { n: "1", t: "Admin adds extra\nfields when creating\nor editing a lead" },
    { n: "2", t: "Fields appear in the\nsurvey form for staff\nor third-party surveyor" },
    { n: "3", t: "Filled values saved\nwith the survey report\ndata" },
    { n: "4", t: "Custom fields print\nas 'Additional Info'\nsection in PDF" },
  ];
  steps.forEach((st, i) => {
    const x = 0.5 + i * 3.3;
    s.addShape(pptx.ShapeType.rect, { x, y: 3.6, w: 3.0, h: 1.5, fill: { color: "eff6ff" }, line: { color: "bfdbfe", width: 0.5 }, rectRadius: 0.08 });
    s.addText(st.n, { x, y: 3.65, w: 3.0, h: 0.4, fontSize: 22, bold: true, color: "3b82f6", align: "center" });
    s.addText(st.t, { x: x + 0.1, y: 4.1, w: 2.8, h: 0.9, fontSize: 10, color: DARK, align: "center" });
    if (i < steps.length - 1) {
      s.addShape(pptx.ShapeType.rect, { x: x + 3.05, y: 4.27, w: 0.22, h: 0.09, fill: { color: "94a3b8" } });
    }
  });
}

// ─── Slide 5: Staff Features ────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addSlideHeader(s, "Staff Member Features", TEAL);

  const col1x = 0.3, col2x = 6.9, colW = 6.3;

  bulletBox(s, col1x, 1.05, colW, 1.55, "Personal Dashboard", [
    "All cases currently assigned to them",
    "Total hours logged across all cases",
    "Attendance summary for the current month",
    "Pending task requests at a glance",
  ], TEAL);

  bulletBox(s, col2x, 1.05, colW, 1.55, "Case Work", [
    "Access assigned case detail page",
    "Fill and submit site visit report",
    "Custom survey fields specific to each case",
    "Upload photos & documents; log hours",
  ], TEAL);

  bulletBox(s, col1x, 2.72, colW, 1.55, "Survey Form", [
    "Full site visit data entry (all standard fields)",
    "Custom fields added by admin for that case",
    "One-tap GPS capture; photo upload (up to 10)",
    "Save draft and return later; submit locks form",
  ], TEAL);

  bulletBox(s, col2x, 2.72, colW, 1.55, "Attendance & Requests", [
    "Mark daily attendance (present / absent / half-day)",
    "View attendance history for the current month",
    "Submit task requests to admin",
    "Track status of submitted requests",
  ], TEAL);

  bulletBox(s, col1x, 4.39, colW, 1.45, "Account", [
    "Self-service password change",
    "Current password verified before update",
    "View own profile details",
  ], TEAL);

  bulletBox(s, col2x, 4.39, colW, 1.45, "Visibility Permissions", [
    "Can view case progress and Activity History",
    "Can download Site Survey Report PDF",
    "Cannot edit case details or delete cases",
    "Cannot see other staff's assignments or admin modules",
  ], TEAL);
}

// ─── Slide 6: Third-Party Surveyor ─────────────────────────────────────────
{
  const s = pptx.addSlide();
  addSlideHeader(s, "Third-Party / External Surveyor", PURPLE);

  bulletBox(s, 0.3, 1.05, 12.9, 3.5, "Secure Link-Based Survey Submission", [
    "Admin generates a one-time secure link with configurable expiry (6 h – 72 h)",
    "External surveyor accesses the full form directly — no login or account required",
    "Form includes all standard site visit fields plus any custom fields defined for that case",
    "One-tap GPS location capture on mobile",
    "Photo uploads directly from the field",
    "Draft auto-save — surveyor can return and continue before final submission",
    "On final submit: case automatically advances to Rate Verification stage",
    "Link becomes invalid after submission; used-at timestamp recorded",
    "Surveyor name and submission time visible in Activity History and Project Timeline",
  ], PURPLE);

  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 4.75, w: 12.9, h: 0.32, fill: { color: "f3e8ff" } });
  s.addText("WHY THIS MATTERS", { x: 0.5, y: 4.75, w: 12.5, h: 0.32, fontSize: 9.5, bold: true, color: PURPLE });

  const why = [
    "No app install needed — works in any mobile browser",
    "Secure — link expires and becomes invalid after use",
    "Auto-advances workflow — no manual step needed from office",
    "Custom fields travel with the link — surveyor fills all required data",
  ];
  why.forEach((t, i) => {
    s.addText("→  " + t, { x: 0.6, y: 5.2 + i * 0.36, w: 12.2, h: 0.32, fontSize: 11, color: DARK });
  });
}

// ─── Slide 7: Closing ───────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addTitle(s, "Thank You", "Questions? Contact Dr. Nimish Pankhedkar, Chemiligence Solutions");
  s.addText("© 2026 Chemiligence Solutions · All rights reserved · Licensed to Nabhangan Engineers", {
    x: 0, y: 6.5, w: "100%", h: 0.4,
    fontSize: 10, color: "60a5fa", align: "center",
  });
}

// ─── Save ────────────────────────────────────────────────────────────────────
await pptx.writeFile({ fileName: "public/nabhangan-features.pptx" });
console.log("Done → public/nabhangan-features.pptx");
