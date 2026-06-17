"""Combined PDF: Trial Letter (p.1) + Credentials (p.2) + Features (p.3+)"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

W, H = A4

NAVY   = colors.HexColor("#1e3a5f")
TEAL   = colors.HexColor("#0f766e")
PURPLE = colors.HexColor("#7e22ce")
BLUE_L = colors.HexColor("#dbeafe")
LIGHT  = colors.HexColor("#f1f5f9")
SLATE  = colors.HexColor("#64748b")
DARK   = colors.HexColor("#1e293b")
WHITE  = colors.white
BLUE   = colors.HexColor("#3b82f6")

def s(name, **kw):
    p = ParagraphStyle(name)
    for k, v in kw.items():
        setattr(p, k, v)
    return p

# ─── Shared styles ───────────────────────────────────────────────────────────
BODY  = s("body",  fontSize=9.5, textColor=DARK,  leading=14, alignment=TA_JUSTIFY)
FOOT  = s("foot",  fontSize=7.5, textColor=SLATE, alignment=TA_CENTER, leading=10)
NOTE  = s("note",  fontSize=8,   textColor=SLATE, leading=11)
HEAD  = s("head",  fontSize=10,  textColor=NAVY,  fontName="Helvetica-Bold", leading=14)
CRED  = s("cred",  fontSize=9.5, textColor=DARK,  leading=14, fontName="Courier")
SIGN  = s("sign",  fontSize=9.5, textColor=NAVY,  fontName="Helvetica-Bold", leading=13)
SIGN2 = s("sign2", fontSize=8.5, textColor=SLATE, leading=12)

def hr(color=NAVY, thick=1.5, before=4, after=10):
    return HRFlowable(width="100%", thickness=thick, color=color,
                      spaceBefore=before, spaceAfter=after)

def subj_box(text):
    return Table(
        [[Paragraph(text, s("sb", fontSize=9.5, textColor=NAVY,
                            fontName="Helvetica-Bold", leading=13))]],
        colWidths=[174*mm],
        style=TableStyle([
            ("BACKGROUND",    (0,0), (-1,-1), BLUE_L),
            ("TOPPADDING",    (0,0), (-1,-1), 5),
            ("BOTTOMPADDING", (0,0), (-1,-1), 5),
            ("LEFTPADDING",   (0,0), (-1,-1), 8),
            ("BOX",           (0,0), (-1,-1), 0.5, colors.HexColor("#bfdbfe")),
        ])
    )

def pricing_box(text):
    return Table(
        [[Paragraph(text, s("pb", fontSize=9.5, textColor=NAVY,
                            fontName="Helvetica-Bold", leading=13))]],
        colWidths=[174*mm],
        style=TableStyle([
            ("BACKGROUND",    (0,0), (-1,-1), LIGHT),
            ("TOPPADDING",    (0,0), (-1,-1), 6),
            ("BOTTOMPADDING", (0,0), (-1,-1), 6),
            ("LEFTPADDING",   (0,0), (-1,-1), 10),
            ("LINEBEFORE",    (0,0), (0,-1), 3, NAVY),
        ])
    )

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 1 — LETTER
# ─────────────────────────────────────────────────────────────────────────────
story = []

# Letterhead
story.append(Table(
    [[Paragraph("Chemiligence Solutions <font size='9' color='#64748b'>(AAN EduTech)</font>",
                s("br", fontSize=15, textColor=NAVY, fontName="Helvetica-Bold", leading=19)),
      Paragraph("16 June 2026",
                s("dt", fontSize=9, textColor=SLATE, alignment=TA_RIGHT, leading=12))]],
    colWidths=[120*mm, 54*mm],
    style=TableStyle([
        ("VALIGN",        (0,0), (-1,-1), "BOTTOM"),
        ("LEFTPADDING",   (0,0), (-1,-1), 0),
        ("RIGHTPADDING",  (0,0), (-1,-1), 0),
        ("TOPPADDING",    (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
    ])
))
story.append(Paragraph("SaaS Product Division · Property & Workflow Management Platform",
                        s("bs", fontSize=8.5, textColor=SLATE, leading=11)))
story.append(hr(NAVY, 2, before=5, after=10))

# Addressee
for line in ["To,", "<b>Mr. Harshad Bhamre</b>", "CEO & Founder, Nabhangan Engineers"]:
    story.append(Paragraph(line, s("addr", fontSize=9.5, textColor=DARK, leading=14)))
story.append(Spacer(1, 8))

# Subject
story.append(subj_box(
    "Subject: 10-Day Free Trial Access — Nabhangan Engineers Workflow Tracker"
))
story.append(Spacer(1, 10))

# Body
story.append(Paragraph("Dear Mr. Bhamre,", BODY))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "We are pleased to extend a <b>10-day free trial</b> of the <b>Nabhangan Engineers "
    "Workflow Tracker</b> — a purpose-built digital platform developed by Chemiligence "
    "Solutions for property valuation and site survey management.",
    BODY
))
story.append(Spacer(1, 5))
story.append(Paragraph(
    "Thank you for your valuable inputs. The platform has been customised to suit the "
    "specific operational needs of Nabhangan Engineers, and we are confident it will "
    "meaningfully streamline your team's workflow.",
    BODY
))
story.append(Spacer(1, 5))
story.append(Paragraph(
    f'The platform is accessible at: <b><font color="#1e3a5f">https://nabhangan.chemiligence.in</font></b>',
    s("url", fontSize=9.5, textColor=DARK, leading=14)
))
story.append(Spacer(1, 10))

# Features
story.append(Paragraph("Key Features", HEAD))
story.append(Spacer(1, 5))

features = [
    ("1.", "End-to-End Case Tracking",
     "8-stage workflow — Lead to Dispatch — with full visibility, stage-wise progress, "
     "and admin control to advance or revoke any stage."),
    ("2.", "Role-Based Access",
     "Separate dashboards for Admin and Staff. Each user sees only their relevant work, "
     "ensuring clarity and data security."),
    ("3.", "Digital Site Survey Form",
     "On-site data entry with GPS capture, photo uploads (up to 10/case), and custom "
     "fields configurable per project at the lead stage."),
    ("4.", "Third-Party Surveyor Link",
     "Admin generates a secure, one-time link for external surveyors — no login needed. "
     "Case auto-advances on submission."),
    ("5.", "Printable Site Survey Report (PDF)",
     "Professional report with logo, bank & property details, GPS, valuation summary, "
     "site photos, and signature strip."),
    ("6.", "Real-Time Dashboard & Reports",
     "Live staff occupancy, activity logs, project timeline, and CSV export — all "
     "timestamps in Indian Standard Time."),
]

feat_rows = []
for num, title, desc in features:
    feat_rows.append([
        Paragraph(num, s("fn", fontSize=9, textColor=NAVY, fontName="Helvetica-Bold",
                          leading=13, alignment=TA_RIGHT)),
        Paragraph(f"<b>{title}</b> — {desc}",
                  s("fd", fontSize=9, textColor=DARK, leading=13)),
    ])

story.append(Table(feat_rows, colWidths=[7*mm, 167*mm],
    style=TableStyle([
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
        ("TOPPADDING",    (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING",   (0,0), (-1,-1), 2),
        ("RIGHTPADDING",  (0,0), (-1,-1), 2),
        ("LINEBELOW",     (0,0), (-1,-1), 0.3, colors.HexColor("#e2e8f0")),
    ])
))
story.append(Spacer(1, 8))

story.append(Paragraph(
    "Login credentials and a detailed feature overview are enclosed with this letter.",
    s("enc", fontSize=9.5, textColor=NAVY, leading=13, fontName="Helvetica-Bold")
))
story.append(Spacer(1, 8))

story.append(pricing_box(
    "Pricing will be mutually discussed and finalised after the trial period."
))
story.append(Spacer(1, 10))

# Closing
story.append(Paragraph(
    "We look forward to your team's experience and remain available for any support during the trial.",
    BODY
))
story.append(Spacer(1, 6))
story.append(Paragraph("Warm regards,", BODY))
story.append(Spacer(1, 10))

# Signatures
story.append(Table(
    [[Paragraph("<b>Dr. Nimish Pankhedkar</b>", SIGN),
      Paragraph("<b>Ankit Jain</b>", SIGN)],
     [Paragraph("Managing Partner", SIGN2),
      Paragraph("Managing Partner", SIGN2)],
     [Paragraph("Chemiligence Solutions (AAN EduTech)", SIGN2),
      Paragraph("Chemiligence Solutions (AAN EduTech)", SIGN2)],
     [Paragraph("+91 77678 14424", SIGN2),
      Paragraph("+91 83904 73349", SIGN2)]],
    colWidths=[87*mm, 87*mm],
    style=TableStyle([
        ("LEFTPADDING",   (0,0), (-1,-1), 0),
        ("RIGHTPADDING",  (0,0), (-1,-1), 0),
        ("TOPPADDING",    (0,0), (-1,-1), 1),
        ("BOTTOMPADDING", (0,0), (-1,-1), 1),
    ])
))
story.append(Spacer(1, 12))
story.append(hr(colors.HexColor("#e2e8f0"), thick=0.5, before=0, after=4))
story.append(Paragraph(
    "© 2026 Chemiligence Solutions (AAN EduTech). All rights reserved. "
    "Confidential — for intended recipient only.",
    FOOT
))

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 2 — CREDENTIALS
# ─────────────────────────────────────────────────────────────────────────────
story.append(PageBreak())

story.append(Table(
    [[Paragraph("Chemiligence Solutions <font size='9' color='#64748b'>(AAN EduTech)</font>",
                s("br2", fontSize=13, textColor=NAVY, fontName="Helvetica-Bold", leading=17))]],
    colWidths=[174*mm],
    style=TableStyle([("LEFTPADDING", (0,0), (-1,-1), 0), ("BOTTOMPADDING", (0,0), (-1,-1), 2)])
))
story.append(hr(NAVY, 2, before=4, after=10))

story.append(Paragraph("Login Credentials", s("lc", fontSize=14, textColor=NAVY,
                                                fontName="Helvetica-Bold", leading=18)))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "Use these credentials to access the platform. We strongly recommend changing your "
    "password immediately after first login via <b>Settings → Password</b>.",
    BODY
))
story.append(Spacer(1, 12))

# URL row
story.append(Table(
    [[Paragraph("Platform URL", s("ul", fontSize=9, textColor=SLATE,
                                   fontName="Helvetica-Bold", leading=12)),
      Paragraph("https://nabhangan.chemiligence.in",
                s("uv", fontSize=10, textColor=NAVY, fontName="Helvetica-Bold",
                  leading=13))]],
    colWidths=[40*mm, 134*mm],
    style=TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), colors.HexColor("#eff6ff")),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("BOX",           (0,0), (-1,-1), 0.5, colors.HexColor("#bfdbfe")),
    ])
))

story.append(Spacer(1, 10))

cred_header = [
    Paragraph("Email Address",   s("ch", fontSize=8.5, textColor=WHITE,
                                    fontName="Helvetica-Bold", leading=11)),
    Paragraph("Name",            s("ch", fontSize=8.5, textColor=WHITE,
                                    fontName="Helvetica-Bold", leading=11)),
    Paragraph("Role",            s("ch", fontSize=8.5, textColor=WHITE,
                                    fontName="Helvetica-Bold", leading=11)),
    Paragraph("Password",        s("ch", fontSize=8.5, textColor=WHITE,
                                    fontName="Helvetica-Bold", leading=11)),
    Paragraph("Change Required", s("ch", fontSize=8.5, textColor=WHITE,
                                    fontName="Helvetica-Bold", leading=11)),
]

cred_data = [
    cred_header,
    [Paragraph("admin@nabhangan.com",    CRED), Paragraph("Administrator",    CRED), Paragraph("Admin", CRED), Paragraph("admin",      CRED), Paragraph("Yes — immediately", NOTE)],
    [Paragraph("harshadab@nabhangan.com",CRED), Paragraph("Harshada Bhole",   CRED), Paragraph("Admin", CRED), Paragraph("staff1706*", CRED), Paragraph("Recommended",     NOTE)],
    [Paragraph("sunilm@nabhangan.com",   CRED), Paragraph("Sunil Malodiya",   CRED), Paragraph("Staff", CRED), Paragraph("staff1706*", CRED), Paragraph("Recommended",     NOTE)],
    [Paragraph("rishiy@nabhangan.com",   CRED), Paragraph("Rishidatta Yadav", CRED), Paragraph("Staff", CRED), Paragraph("staff1706*", CRED), Paragraph("Recommended",     NOTE)],
]

story.append(Table(
    cred_data,
    colWidths=[55*mm, 38*mm, 18*mm, 28*mm, 35*mm],
    style=TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), NAVY),
        ("BACKGROUND",    (0,1), (-1,1), colors.HexColor("#fef3c7")),
        ("BACKGROUND",    (0,2), (-1,2), colors.HexColor("#f8fafc")),
        ("BACKGROUND",    (0,3), (-1,3), WHITE),
        ("BACKGROUND",    (0,4), (-1,4), colors.HexColor("#f8fafc")),
        ("INNERGRID",     (0,0), (-1,-1), 0.4, colors.HexColor("#e2e8f0")),
        ("BOX",           (0,0), (-1,-1), 0.8, NAVY),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("RIGHTPADDING",  (0,0), (-1,-1), 6),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ])
))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "⚠  The admin@nabhangan.com account uses a simple initial password. "
    "Please change it immediately after first login.",
    s("warn", fontSize=8.5, textColor=colors.HexColor("#92400e"), leading=12)
))
story.append(Spacer(1, 20))
story.append(hr(colors.HexColor("#e2e8f0"), thick=0.5, before=0, after=4))
story.append(Paragraph(
    "© 2026 Chemiligence Solutions (AAN EduTech). Confidential — for intended recipient only.",
    FOOT
))

# ─────────────────────────────────────────────────────────────────────────────
# PAGES 3+ — FEATURES (inline, same styles as gen-pdf.py)
# ─────────────────────────────────────────────────────────────────────────────
story.append(PageBreak())

TITLE_S = s("Title", fontSize=24, textColor=WHITE, alignment=TA_CENTER, leading=30,
             fontName="Helvetica-Bold")
SUB_S   = s("Sub",   fontSize=12, textColor=colors.HexColor("#93c5fd"), alignment=TA_CENTER, leading=16)
H1_S    = s("H1",    fontSize=17, textColor=WHITE, fontName="Helvetica-Bold", leading=21)
CAP_S   = s("Cap",   fontSize=8,  textColor=colors.HexColor("#93c5fd"), alignment=TA_CENTER)
SMALL_S = s("Small", fontSize=8,  textColor=SLATE, alignment=TA_CENTER)
BULL    = s("Bull",  fontSize=9.5, textColor=DARK, leading=13, leftIndent=4)
NOTEF   = s("NoteF", fontSize=9,  textColor=DARK, leading=13, leftIndent=8)

def bull_item(text, color=NAVY):
    c = color.hexval().replace("0x","").zfill(6)
    return Paragraph(f'<font color="#{c}">✓</font>  {text}', BULL)

def slide_header_f(title, color=NAVY):
    return Table([[Paragraph(title, H1_S)]], colWidths=[174*mm],
        style=TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), color),
            ("TOPPADDING",    (0,0), (-1,-1), 8),
            ("BOTTOMPADDING", (0,0), (-1,-1), 8),
            ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ]))

def feature_box_f(heading, items, color=NAVY, width=83*mm):
    hrow = [[Paragraph(heading.upper(), s("bh", fontSize=7.5, textColor=WHITE,
                                           fontName="Helvetica-Bold", leading=9))]]
    brows = [[bull_item(it, color)] for it in items]
    return Table(hrow + brows, colWidths=[width],
        style=TableStyle([
            ("BACKGROUND", (0,0), (0,0), color),
            ("BACKGROUND", (0,1), (-1,-1), WHITE),
            ("TOPPADDING",    (0,0), (-1,-1), 4), ("BOTTOMPADDING", (0,0), (-1,-1), 4),
            ("LEFTPADDING",   (0,0), (-1,-1), 7), ("RIGHTPADDING",  (0,0), (-1,-1), 7),
            ("BOX",    (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ]))

def two_col_f(l, r, gap=4*mm):
    return Table([[l, r]], colWidths=[83*mm, 83*mm+gap],
        style=TableStyle([
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("LEFTPADDING",   (0,0), (-1,-1), 0), ("RIGHTPADDING",  (0,0), (-1,-1), 0),
            ("TOPPADDING",    (0,0), (-1,-1), 0), ("BOTTOMPADDING", (0,0), (-1,-1), 0),
            ("RIGHTPADDING", (0,0), (0,-1), gap),
        ]))

def cover_block_f(title, sub, cap):
    return Table([
        [Paragraph(title, TITLE_S)],
        [Spacer(1, 4)],
        [Paragraph(sub, SUB_S)],
        [Spacer(1, 12)],
        [Paragraph(cap, CAP_S)],
    ], colWidths=[174*mm],
    style=TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), NAVY),
        ("TOPPADDING",    (0,0), (-1,-1), 28),
        ("BOTTOMPADDING", (0,0), (-1,-1), 28),
        ("LEFTPADDING",   (0,0), (-1,-1), 18),
        ("RIGHTPADDING",  (0,0), (-1,-1), 18),
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
    ]))

def footer_f():
    return Paragraph(
        "© 2026 Chemiligence Solutions (AAN EduTech) · Licensed to Nabhangan Engineers · Valid till 26 June 2026",
        s("ff", fontSize=7.5, textColor=SLATE, alignment=TA_CENTER)
    )

# ── Features Cover ───────────────────────────────────────────────────────────
story.append(cover_block_f(
    "Platform Features & Capabilities",
    "Nabhangan Engineers — Project & Workflow Tracker",
    "A SaaS product by Chemiligence Solutions (AAN EduTech) · Licensed to Nabhangan Engineers"
))
story.append(PageBreak())

# ── Workflow ─────────────────────────────────────────────────────────────────
story.append(slide_header_f("8-Stage Case Workflow"))
story.append(Spacer(1, 10))

stages = ["1\nLead","2\nSurvey","3\nRate\nVerif.","4\nDrafting","5\nChecking","6\nPrint","7\nScan","8\nDispatch"]
wf_cells = [Paragraph(st, s("wf", fontSize=8, textColor=WHITE, fontName="Helvetica-Bold",
                              alignment=TA_CENTER, leading=10)) for st in stages]
story.append(Table([wf_cells], colWidths=[21.75*mm]*8,
    style=TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), NAVY),
        ("ALIGN",         (0,0), (-1,-1), "CENTER"),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("INNERGRID",     (0,0), (-1,-1), 0.5, colors.HexColor("#2d5080")),
        ("BOX",           (0,0), (-1,-1), 1, NAVY),
    ])))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "Each stage is tracked separately. Staff are assigned per stage. The case advances only when the current stage is submitted and approved.",
    s("wn", fontSize=10, textColor=SLATE, alignment=TA_CENTER, leading=14)))
story.append(Spacer(1, 8))
for pt in ["Role-based access — each person sees only their stage",
           "Auto-advance on third-party survey submission",
           "Admin can revoke any stage for correction",
           "All timestamps in Indian Standard Time (IST)"]:
    story.append(Paragraph("→  " + pt, NOTEF))
story.append(Spacer(1, 12))
story.append(footer_f())
story.append(PageBreak())

# ── Owner Features 1 ─────────────────────────────────────────────────────────
story.append(slide_header_f("Owner / Administrator Features"))
story.append(Spacer(1, 8))
story.append(two_col_f(
    feature_box_f("Dashboard & Overview", ["Live case count across all 8 workflow stages","Realtime Occupancy — staff on currently active work","Third-party surveyor tracking with link status","IST-personalised greeting"]),
    feature_box_f("Case Management", ["Create cases with bank, owner & property details","Add custom survey fields per case at lead stage","Edit case info at any time; delete (admin only)","Mark documents pending; approve flagged cases"])
))
story.append(Spacer(1, 6))
story.append(two_col_f(
    feature_box_f("Staff Assignment", ["Assign staff to any of the 8 workflow stages","Visual assignment matrix — all cases × all staff","Assign non-project 'Other Tasks' to any staff","Generate secure third-party survey links"]),
    feature_box_f("Stage Control", ["Advance case to next stage when ready","Revoke submitted stage for correction","Auto-advance when third-party survey submitted","Visual progress stepper on every case"])
))
story.append(Spacer(1, 6))
story.append(two_col_f(
    feature_box_f("Activity & Timeline", ["Activity History: files, time logs, third-party submissions","Project Timeline: staff, hours & submission timestamps","Lead creation date shown; all timestamps in IST","Download Timeline as CSV"]),
    feature_box_f("Account & Security", ["Secure login with Supabase authentication","Change password with current password verification","Role-based access — admin sees all, staff sees own","Session-protected routes throughout"])
))
story.append(Spacer(1, 10))
story.append(footer_f())
story.append(PageBreak())

# ── Owner Features 2 ─────────────────────────────────────────────────────────
story.append(slide_header_f("Owner / Administrator — Reports & Admin Modules"))
story.append(Spacer(1, 8))
story.append(two_col_f(
    feature_box_f("Site Survey Report (PDF)", ["Printable PDF with Nabhangan Engineers logo","Bank info, owner, property address, site visit details","GPS coordinates from on-site measurement","Property dimensions, building features & valuation","Custom project-specific fields in separate section","Site photos embedded (up to 10)","Signature strip and copyright footer"], width=83*mm),
    feature_box_f("Admin Modules", ["Staff directory — add, edit, activate / deactivate","Assignments panel — stage allocation for all cases","Other Tasks — assign non-project work to staff","Third-Party Survey Link with custom expiry","Task Requests — approve or reject staff requests","Reports module for business analytics"], width=83*mm)
))
story.append(Spacer(1, 10))
story.append(Table(
    [[Paragraph("CUSTOM SURVEY FIELDS — How It Works",
                s("cf", fontSize=9, textColor=NAVY, fontName="Helvetica-Bold", leading=11))]],
    colWidths=[174*mm],
    style=TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#dbeafe")),
                      ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),("LEFTPADDING",(0,0),(-1,-1),8)])))
steps = [("1","Admin adds fields when creating or editing a lead"),
         ("2","Fields appear in survey form for staff or third-party"),
         ("3","Filled values saved with the survey report data"),
         ("4","Custom fields print as 'Additional Info' in PDF")]
story.append(Spacer(1, 4))
story.append(Table(
    [[Table([[Paragraph(n, s("sn", fontSize=18, textColor=BLUE, fontName="Helvetica-Bold",
                              alignment=TA_CENTER, leading=22))],
             [Paragraph(t, s("st", fontSize=8.5, textColor=DARK, alignment=TA_CENTER, leading=12))]],
            colWidths=[39*mm],
            style=TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#eff6ff")),
                               ("BOX",(0,0),(-1,-1),0.5,colors.HexColor("#bfdbfe")),
                               ("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6),
                               ("ALIGN",(0,0),(-1,-1),"CENTER")])) for n, t in steps]],
    colWidths=[41.5*mm]*4,
    style=TableStyle([("LEFTPADDING",(0,0),(-1,-1),1),("RIGHTPADDING",(0,0),(-1,-1),1),
                      ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0)])))
story.append(Spacer(1, 10))
story.append(footer_f())
story.append(PageBreak())

# ── Staff Features ────────────────────────────────────────────────────────────
story.append(slide_header_f("Staff Member Features", TEAL))
story.append(Spacer(1, 8))
story.append(two_col_f(
    feature_box_f("Personal Dashboard", ["All cases currently assigned to them","Total hours logged across all cases","Attendance summary for the current month","Pending task requests at a glance"], TEAL),
    feature_box_f("Case Work", ["Access assigned case detail page","Fill and submit site visit report","Custom survey fields specific to each case","Upload photos & documents; log hours"], TEAL)
))
story.append(Spacer(1, 6))
story.append(two_col_f(
    feature_box_f("Survey Form", ["Full site visit data entry (all standard fields)","Custom fields added by admin for that case","One-tap GPS capture; photo upload (up to 10)","Save draft and return later; submit locks form"], TEAL),
    feature_box_f("Attendance & Requests", ["Mark daily attendance (present / absent / half-day)","View attendance history for current month","Submit task requests to admin","Track status of submitted requests"], TEAL)
))
story.append(Spacer(1, 6))
story.append(two_col_f(
    feature_box_f("Account", ["Self-service password change","Current password verified before update","View own profile details"], TEAL),
    feature_box_f("Visibility Permissions", ["Can view case progress and Activity History","Can download Site Survey Report PDF","Cannot edit case details or delete cases","Cannot see other staff's data or admin modules"], TEAL)
))
story.append(Spacer(1, 10))
story.append(footer_f())
story.append(PageBreak())

# ── Third-Party ───────────────────────────────────────────────────────────────
story.append(slide_header_f("Third-Party / External Surveyor", PURPLE))
story.append(Spacer(1, 8))
story.append(feature_box_f("Secure Link-Based Survey Submission", [
    "Admin generates a one-time secure link with configurable expiry (6 h – 72 h)",
    "External surveyor accesses the full form directly — no login or account required",
    "Form includes all standard fields plus custom fields defined for that case",
    "One-tap GPS location capture on mobile",
    "Photo uploads directly from the field",
    "Draft auto-save — surveyor can return and continue before final submission",
    "On final submit: case automatically advances to Rate Verification stage",
    "Link becomes invalid after submission; used-at timestamp recorded",
    "Surveyor name and submission time visible in Activity History and Project Timeline",
], PURPLE, width=174*mm))
story.append(Spacer(1, 10))
story.append(Table(
    [[Paragraph("WHY THIS MATTERS", s("wh", fontSize=9, textColor=PURPLE,
                                       fontName="Helvetica-Bold", leading=11))]],
    colWidths=[174*mm],
    style=TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#f3e8ff")),
                      ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),("LEFTPADDING",(0,0),(-1,-1),8)])))
for pt in ["No app install needed — works in any mobile browser",
           "Secure — link expires and becomes invalid after use",
           "Auto-advances workflow — no manual step needed from office",
           "Custom fields travel with the link — surveyor fills all required data"]:
    story.append(Paragraph("→  " + pt, NOTEF))
story.append(Spacer(1, 10))
story.append(footer_f())

# ─────────────────────────────────────────────────────────────────────────────
# BUILD
# ─────────────────────────────────────────────────────────────────────────────
out = "/home/user/nabhangan-engg/public/nabhangan-complete.pdf"
doc = SimpleDocTemplate(out, pagesize=A4,
    leftMargin=16*mm, rightMargin=16*mm,
    topMargin=14*mm, bottomMargin=12*mm)
doc.build(story)
print(f"Done → {out}")
