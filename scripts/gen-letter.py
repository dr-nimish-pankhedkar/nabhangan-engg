"""Generate the trial offer letter PDF for Nabhangan Engineers."""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

W, H = A4

NAVY   = colors.HexColor("#1e3a5f")
SLATE  = colors.HexColor("#64748b")
DARK   = colors.HexColor("#1e293b")
LIGHT  = colors.HexColor("#f1f5f9")
WHITE  = colors.white
BLUE   = colors.HexColor("#dbeafe")

def s(name, **kw):
    p = ParagraphStyle(name)
    for k, v in kw.items():
        setattr(p, k, v)
    return p

BRAND   = s("brand",  fontSize=16, textColor=NAVY,  fontName="Helvetica-Bold", leading=20)
BRAND2  = s("brand2", fontSize=9,  textColor=SLATE, leading=12)
DATE_S  = s("date",   fontSize=9,  textColor=SLATE, alignment=TA_RIGHT, leading=12)
ADDR_S  = s("addr",   fontSize=10, textColor=DARK,  leading=15)
BODY_S  = s("body",   fontSize=10, textColor=DARK,  leading=16, alignment=TA_JUSTIFY)
FEAT_S  = s("feat",   fontSize=10, textColor=DARK,  leading=15, leftIndent=6)
HEAD_S  = s("head",   fontSize=10, textColor=NAVY,  fontName="Helvetica-Bold", leading=14)
CRED_S  = s("cred",   fontSize=9.5, textColor=DARK, leading=14, fontName="Courier")
NOTE_S  = s("note",   fontSize=8.5, textColor=SLATE, leading=12)
REG_S   = s("reg",    fontSize=10, textColor=DARK,  leading=16)
SIGN_S  = s("sign",   fontSize=10, textColor=NAVY,  fontName="Helvetica-Bold", leading=15)
FOOT_S  = s("foot",   fontSize=7.5, textColor=SLATE, alignment=TA_CENTER, leading=10)

story = []

# ── Letterhead ───────────────────────────────────────────────────────────────
header_data = [[
    Paragraph("Chemiligence Solutions", BRAND),
    Paragraph("16 June 2026", DATE_S),
]]
header_table = Table(header_data, colWidths=[120*mm, 60*mm],
    style=TableStyle([
        ("ALIGN",         (1,0), (1,0), "RIGHT"),
        ("VALIGN",        (0,0), (-1,-1), "BOTTOM"),
        ("LEFTPADDING",   (0,0), (-1,-1), 0),
        ("RIGHTPADDING",  (0,0), (-1,-1), 0),
        ("TOPPADDING",    (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ])
)
story.append(header_table)
story.append(Paragraph("SaaS Product Division · Property & Workflow Management Platform", BRAND2))
story.append(HRFlowable(width="100%", thickness=2, color=NAVY, spaceBefore=6, spaceAfter=14))

# ── Addressee ────────────────────────────────────────────────────────────────
story.append(Paragraph("To,", ADDR_S))
story.append(Spacer(1, 2))
story.append(Paragraph("<b>Mr. Harshad Bhamre</b>", ADDR_S))
story.append(Paragraph("CEO & Founder", ADDR_S))
story.append(Paragraph("Nabhangan Engineers", ADDR_S))
story.append(Spacer(1, 14))

# ── Subject ──────────────────────────────────────────────────────────────────
story.append(Table(
    [[Paragraph("Subject: Trial Access — Nabhangan Engineers Workflow Tracker Platform",
                s("subj", fontSize=10, textColor=NAVY, fontName="Helvetica-Bold", leading=13))]],
    colWidths=[182*mm],
    style=TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), BLUE),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("BOX",           (0,0), (-1,-1), 0.5, colors.HexColor("#bfdbfe")),
    ])
))
story.append(Spacer(1, 14))

# ── Body ─────────────────────────────────────────────────────────────────────
story.append(Paragraph("Dear Mr. Bhamre,", BODY_S))
story.append(Spacer(1, 10))
story.append(Paragraph(
    "We are pleased to extend a <b>10-day free trial</b> of the <b>Nabhangan Engineers Workflow Tracker</b>, "
    "a purpose-built SaaS platform developed by Chemiligence Solutions for property valuation and site survey management.",
    BODY_S
))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "We sincerely thank you for your valuable inputs and feedback during our discussions. "
    "The platform has been customised specifically to suit the operational needs of Nabhangan Engineers, "
    "and we are confident it will meaningfully streamline your team's day-to-day workflow.",
    BODY_S
))
story.append(Spacer(1, 14))

# ── Features ─────────────────────────────────────────────────────────────────
story.append(Paragraph("Platform Highlights", HEAD_S))
story.append(Spacer(1, 6))

features = [
    ("End-to-End Case Tracking",
     "Manage every valuation case through 8 defined stages — Lead, Survey, Rate Verification, Drafting, Checking, Print, Scan, and Dispatch — with full visibility at every step."),
    ("Role-Based Access Control",
     "Separate dashboards for Admin and Staff. Each team member sees only what is relevant to their role, ensuring clarity and data security."),
    ("Digital Site Survey Form",
     "A comprehensive on-site data entry form with GPS capture, photo uploads (up to 10 per case), and project-specific custom fields configurable per case."),
    ("Third-Party Surveyor Access",
     "Generate a secure, one-time survey link for external surveyors — no login required. The case automatically advances upon submission."),
    ("Printable Site Survey Report",
     "Generate a professional PDF report with the Nabhangan Engineers logo, covering bank details, property data, GPS, valuation summary, site photos, and a signature strip."),
    ("Real-Time Dashboard & Activity History",
     "Live staff occupancy, case-wise activity logs, project timeline with submission timestamps, and downloadable CSV reports — all in Indian Standard Time."),
]

for title, desc in features:
    story.append(Table(
        [[Paragraph(f"■  {title}", s("ft", fontSize=10, textColor=NAVY, fontName="Helvetica-Bold", leading=13)),
          Paragraph(desc, s("fd", fontSize=9.5, textColor=DARK, leading=13))]],
        colWidths=[52*mm, 130*mm],
        style=TableStyle([
            ("VALIGN",        (0,0), (-1,-1), "TOP"),
            ("LEFTPADDING",   (0,0), (-1,-1), 4),
            ("RIGHTPADDING",  (0,0), (-1,-1), 4),
            ("TOPPADDING",    (0,0), (-1,-1), 5),
            ("BOTTOMPADDING", (0,0), (-1,-1), 5),
            ("LINEBELOW",     (0,0), (-1,-1), 0.3, colors.HexColor("#e2e8f0")),
        ])
    ))

story.append(Spacer(1, 6))
story.append(Paragraph(
    "A detailed feature document is attached for your reference.",
    BODY_S
))
story.append(Spacer(1, 14))

# ── Pricing ──────────────────────────────────────────────────────────────────
story.append(Table(
    [[Paragraph(
        "Pricing will be mutually discussed and finalised after the completion of the trial period.",
        s("pr", fontSize=10, textColor=NAVY, leading=14, fontName="Helvetica-Bold")
    )]],
    colWidths=[182*mm],
    style=TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LINEBEFORECOLOR", (0,0), (0,-1), colors.HexColor("#1e3a5f")),
        ("LINEBEFORE",    (0,0), (0,-1), 3, NAVY),
    ])
))
story.append(Spacer(1, 16))

# ── Login Credentials ────────────────────────────────────────────────────────
story.append(Paragraph("Login Credentials", HEAD_S))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Please use the following credentials to access the platform. "
    "We recommend each user change their password upon first login via <b>Settings → Password</b>.",
    BODY_S
))
story.append(Spacer(1, 8))

cred_rows = [
    [Paragraph("<b>Platform URL</b>", CRED_S), Paragraph("https://nabhangan.chemiligence.in", CRED_S), Paragraph("", CRED_S)],
    [Paragraph("", CRED_S), Paragraph("", CRED_S), Paragraph("", CRED_S)],
    [Paragraph("<b>Email Address</b>", CRED_S), Paragraph("<b>Role</b>", CRED_S), Paragraph("<b>Password</b>", CRED_S)],
    [Paragraph("harshadab@nabhangan.com", CRED_S), Paragraph("Admin", CRED_S), Paragraph("staff1706*", CRED_S)],
    [Paragraph("sunilm@nabhangan.com",    CRED_S), Paragraph("Staff", CRED_S), Paragraph("staff1706*", CRED_S)],
    [Paragraph("rishiy@nabhangan.com",    CRED_S), Paragraph("Staff", CRED_S), Paragraph("staff1706*", CRED_S)],
]
cred_table = Table(cred_rows, colWidths=[82*mm, 40*mm, 60*mm],
    style=TableStyle([
        ("BACKGROUND",    (0,2), (-1,2), colors.HexColor("#1e3a5f")),
        ("TEXTCOLOR",     (0,2), (-1,2), WHITE),
        ("BACKGROUND",    (0,3), (-1,3), colors.HexColor("#f8fafc")),
        ("BACKGROUND",    (0,4), (-1,4), WHITE),
        ("BACKGROUND",    (0,5), (-1,5), colors.HexColor("#f8fafc")),
        ("BACKGROUND",    (0,0), (-1,1), colors.HexColor("#eff6ff")),
        ("INNERGRID",     (0,0), (-1,-1), 0.4, colors.HexColor("#e2e8f0")),
        ("BOX",           (0,0), (-1,-1), 0.8, NAVY),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("SPAN",          (1,0), (2,0)),
        ("SPAN",          (0,1), (2,1)),
    ])
)
story.append(cred_table)
story.append(Spacer(1, 4))
story.append(Paragraph(
    "* Passwords are set identically for initial access. Please change them immediately after first login.",
    NOTE_S
))
story.append(Spacer(1, 18))

# ── Closing ──────────────────────────────────────────────────────────────────
story.append(Paragraph(
    "We look forward to your team's experience with the platform and remain available for any support or queries during the trial period.",
    BODY_S
))
story.append(Spacer(1, 8))
story.append(Paragraph("Warm regards,", BODY_S))
story.append(Spacer(1, 14))

sig_data = [[
    Paragraph("<b>Dr. Nimish Pankhedkar</b>", SIGN_S),
    Paragraph("<b>Ankit Jain</b>", SIGN_S),
]]
sig_sub = [[
    Paragraph("Founder & CEO, Chemiligence Solutions", NOTE_S),
    Paragraph("Co-founder, Chemiligence Solutions", NOTE_S),
]]
story.append(Table(sig_data, colWidths=[91*mm, 91*mm],
    style=TableStyle([("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 0),
                       ("TOPPADDING", (0,0), (-1,-1), 0), ("BOTTOMPADDING", (0,0), (-1,-1), 0)])))
story.append(Table(sig_sub, colWidths=[91*mm, 91*mm],
    style=TableStyle([("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 0),
                       ("TOPPADDING", (0,0), (-1,-1), 0), ("BOTTOMPADDING", (0,0), (-1,-1), 2)])))

story.append(Spacer(1, 24))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceBefore=0, spaceAfter=6))
story.append(Paragraph(
    "© 2026 Chemiligence Solutions. All rights reserved. · Confidential — for intended recipient only.",
    FOOT_S
))

# ─── Build ───────────────────────────────────────────────────────────────────
out = "/home/user/nabhangan-engg/public/nabhangan-trial-letter.pdf"
doc = SimpleDocTemplate(
    out, pagesize=A4,
    leftMargin=18*mm, rightMargin=18*mm,
    topMargin=16*mm, bottomMargin=14*mm,
)
doc.build(story)
print(f"Done → {out}")
