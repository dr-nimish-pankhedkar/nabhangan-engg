"""Generate Nabhangan Features PDF matching the PPTX slides."""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import PageBreak

W, H = A4  # 595 x 842

NAVY  = colors.HexColor("#1e3a5f")
TEAL  = colors.HexColor("#0f766e")
PURPLE= colors.HexColor("#7e22ce")
BLUE  = colors.HexColor("#3b82f6")
LIGHT = colors.HexColor("#f1f5f9")
SLATE = colors.HexColor("#64748b")
DARK  = colors.HexColor("#1e293b")
WHITE = colors.white

def style(name, **kw):
    base = ParagraphStyle(name)
    for k, v in kw.items():
        setattr(base, k, v)
    return base

TITLE_S  = style("Title",  fontSize=26, textColor=WHITE, alignment=TA_CENTER, leading=32, fontName="Helvetica-Bold")
SUB_S    = style("Sub",    fontSize=13, textColor=colors.HexColor("#93c5fd"), alignment=TA_CENTER, leading=18)
H1_S     = style("H1",     fontSize=18, textColor=WHITE, fontName="Helvetica-Bold", leading=22)
CAP_S    = style("Cap",    fontSize=8,  textColor=colors.HexColor("#93c5fd"), alignment=TA_CENTER)
BODY_S   = style("Body",   fontSize=10, textColor=DARK,  leading=14)
LABEL_S  = style("Label",  fontSize=8,  textColor=WHITE, fontName="Helvetica-Bold", leading=10)
BULLET_S = style("Bullet", fontSize=9.5, textColor=DARK, leading=13, leftIndent=4)
SMALL_S  = style("Small",  fontSize=8,  textColor=SLATE, alignment=TA_CENTER)
SEC_S    = style("Sec",    fontSize=14, textColor=NAVY,  fontName="Helvetica-Bold", leading=18)
NOTE_S   = style("Note",   fontSize=9,  textColor=DARK,  leading=13, leftIndent=8)

def bullet_item(text, color=NAVY):
    c = color.hexval().replace("#","")
    return Paragraph(f'<font color="#{c}">✓</font>  {text}', BULLET_S)

def section_heading(label, color=NAVY):
    return Table(
        [[Paragraph(label, style("sh", fontSize=9, textColor=WHITE, fontName="Helvetica-Bold", leading=11))]],
        colWidths=[155*mm],
        style=TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), color),
            ("TOPPADDING",    (0,0), (-1,-1), 5),
            ("BOTTOMPADDING", (0,0), (-1,-1), 5),
            ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ])
    )

def feature_box(heading, items, color=NAVY, width=75*mm):
    heading_row = [[Paragraph(heading.upper(), style("bh", fontSize=7.5, textColor=WHITE, fontName="Helvetica-Bold", leading=9))]]
    bullet_rows = [[bullet_item(it, color)] for it in items]
    rows = heading_row + bullet_rows
    ts = TableStyle([
        ("BACKGROUND", (0,0), (0,0), color),
        ("BACKGROUND", (0,1), (-1,-1), WHITE),
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 7),
        ("RIGHTPADDING",  (0,0), (-1,-1), 7),
        ("BOX",    (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ("LINEBELOW", (0,0), (0,0), 0, WHITE),
    ])
    return Table(rows, colWidths=[width], style=ts)

def two_col(left_box, right_box, lw=83*mm, rw=83*mm, gap=4*mm):
    return Table([[left_box, right_box]], colWidths=[lw, rw],
                 style=TableStyle([
                     ("LEFTPADDING",   (0,0), (-1,-1), 0),
                     ("RIGHTPADDING",  (0,0), (-1,-1), 0),
                     ("TOPPADDING",    (0,0), (-1,-1), 0),
                     ("BOTTOMPADDING", (0,0), (-1,-1), 0),
                     ("ALIGN", (0,0), (-1,-1), "LEFT"),
                     ("VALIGN", (0,0), (-1,-1), "TOP"),
                     ("RIGHTPADDING", (0,0), (0,-1), gap),
                 ]))

def cover_block(title, sub, cap):
    return [
        Table(
            [[Paragraph(title, TITLE_S)],
             [Spacer(1, 6)],
             [Paragraph(sub, SUB_S)],
             [Spacer(1, 18)],
             [Paragraph(cap, CAP_S)]],
            colWidths=[170*mm],
            style=TableStyle([
                ("BACKGROUND", (0,0), (-1,-1), NAVY),
                ("TOPPADDING",    (0,0), (-1,-1), 32),
                ("BOTTOMPADDING", (0,0), (-1,-1), 32),
                ("LEFTPADDING",   (0,0), (-1,-1), 20),
                ("RIGHTPADDING",  (0,0), (-1,-1), 20),
                ("ALIGN", (0,0), (-1,-1), "CENTER"),
            ])
        )
    ]

def slide_header(title, color=NAVY):
    return Table(
        [[Paragraph(title, H1_S)]],
        colWidths=[170*mm],
        style=TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), color),
            ("TOPPADDING",    (0,0), (-1,-1), 8),
            ("BOTTOMPADDING", (0,0), (-1,-1), 8),
            ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ])
    )

def divider(color=NAVY):
    return HRFlowable(width="100%", thickness=1.5, color=color, spaceAfter=6, spaceBefore=6)

def footer_text():
    return Paragraph(
        "© 2026 Chemiligence Solutions · All rights reserved · Licensed to Nabhangan Engineers · Valid till 26 June 2026",
        style("ft", fontSize=7.5, textColor=SLATE, alignment=TA_CENTER)
    )

# ─── Build story ─────────────────────────────────────────────────────────────
story = []

# ── SLIDE 1: Cover ──────────────────────────────────────────────────────────
story += cover_block(
    "Platform Features & Capabilities",
    "Nabhangan Engineers — Project & Workflow Tracker",
    "A SaaS product by Chemiligence Solutions · Licensed to Nabhangan Engineers"
)
story.append(PageBreak())

# ── SLIDE 2: Workflow ────────────────────────────────────────────────────────
story.append(slide_header("8-Stage Case Workflow"))
story.append(Spacer(1, 10))

stages = ["1\nLead","2\nSurvey","3\nRate\nVerif.","4\nDrafting","5\nChecking","6\nPrint","7\nScan","8\nDispatch"]
stage_cells = []
for s in stages:
    stage_cells.append(Paragraph(s, style("wf", fontSize=8, textColor=WHITE, fontName="Helvetica-Bold",
                                           alignment=TA_CENTER, leading=10)))
wf_table = Table(
    [stage_cells],
    colWidths=[21*mm]*8,
    style=TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), NAVY),
        ("ALIGN",         (0,0), (-1,-1), "CENTER"),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("INNERGRID",     (0,0), (-1,-1), 0.5, colors.HexColor("#2d5080")),
        ("BOX",           (0,0), (-1,-1), 1, NAVY),
        ("ROWBACKGROUNDS",(0,0), (-1,-1), [NAVY]),
    ])
)
story.append(wf_table)
story.append(Spacer(1, 10))
story.append(Paragraph(
    "Each stage is tracked separately. Staff are assigned per stage. The case advances only when the current stage is submitted and approved.",
    style("wn", fontSize=10, textColor=SLATE, alignment=TA_CENTER, leading=14)
))
story.append(Spacer(1, 8))
for pt in [
    "Role-based access — each person sees only their stage",
    "Auto-advance on third-party survey submission",
    "Admin can revoke any stage for correction",
    "All timestamps recorded in Indian Standard Time (IST)",
]:
    story.append(Paragraph("→  " + pt, NOTE_S))
story.append(Spacer(1, 14))
story.append(footer_text())
story.append(PageBreak())

# ── SLIDE 3: Owner Features 1 ────────────────────────────────────────────────
story.append(slide_header("Owner / Administrator Features"))
story.append(Spacer(1, 8))
story.append(two_col(
    feature_box("Dashboard & Overview", [
        "Live case count across all 8 workflow stages",
        "Realtime Occupancy — staff on currently active work",
        "Third-party surveyor tracking with link status",
        "IST-personalised greeting",
    ]),
    feature_box("Case Management", [
        "Create cases with bank, owner & property details",
        "Add custom survey fields per case at lead stage",
        "Edit case info at any time; delete (admin only)",
        "Mark documents pending; approve flagged cases",
    ])
))
story.append(Spacer(1, 6))
story.append(two_col(
    feature_box("Staff Assignment", [
        "Assign staff to any of the 8 workflow stages",
        "Visual assignment matrix — all cases × all staff",
        "Assign non-project 'Other Tasks' to any staff",
        "Generate secure third-party survey links",
    ]),
    feature_box("Stage Control", [
        "Advance case to next stage when ready",
        "Revoke submitted stage for correction",
        "Auto-advance when third-party survey submitted",
        "Visual progress stepper on every case",
    ])
))
story.append(Spacer(1, 6))
story.append(two_col(
    feature_box("Activity & Timeline", [
        "Activity History: files, time logs, third-party submissions",
        "Project Timeline: staff, hours & submission timestamps",
        "Lead creation date shown; all timestamps in IST",
        "Download Timeline as CSV",
    ]),
    feature_box("Account & Security", [
        "Secure login with Supabase authentication",
        "Change password with current password verification",
        "Role-based access — admin sees all, staff sees own",
        "Session-protected routes throughout",
    ])
))
story.append(Spacer(1, 10))
story.append(footer_text())
story.append(PageBreak())

# ── SLIDE 4: Owner Features 2 ────────────────────────────────────────────────
story.append(slide_header("Owner / Administrator — Reports & Admin Modules"))
story.append(Spacer(1, 8))
story.append(two_col(
    feature_box("Site Survey Report (PDF)", [
        "Printable PDF with Nabhangan Engineers logo",
        "Bank info, owner, property address, site visit details",
        "GPS coordinates from on-site measurement",
        "Property dimensions, building features & valuation",
        "Custom project-specific fields in separate section",
        "Site photos embedded (up to 10)",
        "Signature strip and copyright footer",
    ], width=83*mm),
    feature_box("Admin Modules", [
        "Staff directory — add, edit, activate / deactivate",
        "Assignments panel — stage allocation for all cases",
        "Other Tasks — assign non-project work to staff",
        "Third-Party Survey Link with custom expiry",
        "Task Requests — approve or reject staff requests",
        "Reports module for business analytics",
    ], width=83*mm)
))
story.append(Spacer(1, 10))

# Custom fields callout
story.append(Table(
    [[Paragraph("CUSTOM SURVEY FIELDS — How It Works", style("cf_h", fontSize=9, textColor=NAVY, fontName="Helvetica-Bold", leading=11))]],
    colWidths=[170*mm],
    style=TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#dbeafe")),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
    ])
))
steps = [
    ("1", "Admin adds extra fields when creating or editing a lead"),
    ("2", "Fields appear in the survey form for staff or third-party surveyor"),
    ("3", "Filled values saved with the survey report data"),
    ("4", "Custom fields print as 'Additional Info' section in PDF"),
]
step_cells = [[
    Table(
        [[Paragraph(n, style("sn", fontSize=20, textColor=BLUE, fontName="Helvetica-Bold", alignment=TA_CENTER, leading=24))],
         [Paragraph(t, style("st", fontSize=9, textColor=DARK, alignment=TA_CENTER, leading=12))]],
        colWidths=[39*mm],
        style=TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#eff6ff")),
            ("BOX", (0,0), (-1,-1), 0.5, colors.HexColor("#bfdbfe")),
            ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6),
            ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ])
    ) for n, t in steps
]]
story.append(Spacer(1, 4))
story.append(Table(step_cells, colWidths=[41*mm, 41*mm, 41*mm, 41*mm+4*mm],
    style=TableStyle([
        ("LEFTPADDING", (0,0), (-1,-1), 2), ("RIGHTPADDING", (0,0), (-1,-1), 2),
        ("TOPPADDING", (0,0), (-1,-1), 0), ("BOTTOMPADDING", (0,0), (-1,-1), 0),
    ])
))
story.append(Spacer(1, 10))
story.append(footer_text())
story.append(PageBreak())

# ── SLIDE 5: Staff Features ──────────────────────────────────────────────────
story.append(slide_header("Staff Member Features", TEAL))
story.append(Spacer(1, 8))
story.append(two_col(
    feature_box("Personal Dashboard", [
        "All cases currently assigned to them",
        "Total hours logged across all cases",
        "Attendance summary for the current month",
        "Pending task requests at a glance",
    ], TEAL),
    feature_box("Case Work", [
        "Access assigned case detail page",
        "Fill and submit site visit report",
        "Custom survey fields specific to each case",
        "Upload photos & documents; log hours",
    ], TEAL)
))
story.append(Spacer(1, 6))
story.append(two_col(
    feature_box("Survey Form", [
        "Full site visit data entry (all standard fields)",
        "Custom fields added by admin for that case",
        "One-tap GPS capture; photo upload (up to 10)",
        "Save draft and return later; submit locks form",
    ], TEAL),
    feature_box("Attendance & Requests", [
        "Mark daily attendance (present / absent / half-day)",
        "View attendance history for current month",
        "Submit task requests to admin",
        "Track status of submitted requests",
    ], TEAL)
))
story.append(Spacer(1, 6))
story.append(two_col(
    feature_box("Account", [
        "Self-service password change",
        "Current password verified before update",
        "View own profile details",
    ], TEAL),
    feature_box("Visibility Permissions", [
        "Can view case progress and Activity History",
        "Can download Site Survey Report PDF",
        "Cannot edit case details or delete cases",
        "Cannot see other staff's data or admin modules",
    ], TEAL)
))
story.append(Spacer(1, 10))
story.append(footer_text())
story.append(PageBreak())

# ── SLIDE 6: Third-Party ─────────────────────────────────────────────────────
story.append(slide_header("Third-Party / External Surveyor", PURPLE))
story.append(Spacer(1, 8))
story.append(feature_box("Secure Link-Based Survey Submission", [
    "Admin generates a one-time secure link with configurable expiry (6 h – 72 h)",
    "External surveyor accesses the full form directly — no login or account required",
    "Form includes all standard fields plus custom fields defined for that case",
    "One-tap GPS location capture on mobile",
    "Photo uploads directly from the field",
    "Draft auto-save — surveyor can return and continue before final submission",
    "On final submit: case automatically advances to Rate Verification stage",
    "Link becomes invalid after submission; used-at timestamp recorded",
    "Surveyor name and submission time visible in Activity History and Project Timeline",
], PURPLE, width=170*mm))
story.append(Spacer(1, 10))

story.append(Table(
    [[Paragraph("WHY THIS MATTERS", style("wh", fontSize=9, textColor=PURPLE, fontName="Helvetica-Bold", leading=11))]],
    colWidths=[170*mm],
    style=TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#f3e8ff")),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
    ])
))
for pt in [
    "No app install needed — works in any mobile browser",
    "Secure — link expires and becomes invalid after use",
    "Auto-advances workflow — no manual step needed from office",
    "Custom fields travel with the link — surveyor fills all required data",
]:
    story.append(Paragraph("→  " + pt, NOTE_S))
story.append(Spacer(1, 10))
story.append(footer_text())
story.append(PageBreak())

# ── SLIDE 7: Closing ─────────────────────────────────────────────────────────
story += cover_block(
    "Thank You",
    "Questions? Contact Dr. Nimish Pankhedkar\nChemiligence Solutions",
    "© 2026 Chemiligence Solutions · All rights reserved · Licensed to Nabhangan Engineers"
)

# ─── Build PDF ───────────────────────────────────────────────────────────────
out = "/home/user/nabhangan-engg/public/nabhangan-features.pdf"
doc = SimpleDocTemplate(
    out,
    pagesize=A4,
    leftMargin=14*mm, rightMargin=14*mm,
    topMargin=12*mm, bottomMargin=12*mm,
)
doc.build(story)
print(f"Done → {out}")
