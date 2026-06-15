"""
Generates the Nabhangan Engineers feature brochure PDF.
Run: python3 generate_brochure.py
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER

W, H = A4   # 210 × 297 mm  →  595.27 × 841.89 pt

# ── Brand colours ──────────────────────────────────────────────────────────────
NAVY    = HexColor("#1e3a5f")
NAVY_LT = HexColor("#2a4f82")
GOLD    = HexColor("#c9a84c")
SLATE   = HexColor("#475569")
LIGHT   = HexColor("#f1f5f9")
WHITE   = colors.white
PURPLE  = HexColor("#7c3aed")
GREEN   = HexColor("#16a34a")
AMBER   = HexColor("#d97706")

def draw_slide_bg(c, accent=None):
    """Fill slide with a white background and a left accent bar."""
    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    bar_w = 7 * mm
    c.setFillColor(accent or NAVY)
    c.rect(0, 0, bar_w, H, fill=1, stroke=0)

def header_box(c, text, y, color=NAVY):
    """Full-width coloured header box."""
    pad = 14 * mm
    c.setFillColor(color)
    c.rect(pad, y, W - 2*pad, 11*mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(pad + 5*mm, y + 3.5*mm, text)

def bullet(c, icon, text, x, y, width=W - 44*mm, icon_color=NAVY):
    """Single bullet row with icon character."""
    c.setFillColor(icon_color)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x, y, icon)
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 9)
    # Wrap text manually
    words = text.split()
    line, lines = "", []
    char_limit = int(width / 5.5)
    for w in words:
        if len(line) + len(w) + 1 <= char_limit:
            line = (line + " " + w).strip()
        else:
            lines.append(line)
            line = w
    if line:
        lines.append(line)
    for i, ln in enumerate(lines):
        c.drawString(x + 5*mm, y - i * 4.5*mm, ln)
    return y - (len(lines)) * 4.5*mm - 1.5*mm

def feature_card(c, title, bullets, x, y, w, h, color=NAVY):
    """Draws a rounded-rect feature card."""
    r = 4
    c.setFillColor(LIGHT)
    c.roundRect(x, y, w, h, r, fill=1, stroke=0)
    c.setFillColor(color)
    c.roundRect(x, y + h - 8*mm, w, 8*mm, r, fill=1, stroke=0)
    # fix top corners
    c.rect(x, y + h - 4*mm, w, 4*mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(x + 3*mm, y + h - 5.5*mm, title)
    cy = y + h - 11*mm
    for b in bullets:
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(x + 3*mm, cy, "▸")
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 7.5)
        c.drawString(x + 6*mm, cy, b)
        cy -= 4.8*mm
    return cy

def page_footer(c, page_num, total):
    c.setFillColor(NAVY)
    c.rect(0, 0, W, 9*mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 7)
    c.drawString(14*mm, 3*mm, "© 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions · All rights reserved · Confidential")
    c.drawRightString(W - 10*mm, 3*mm, f"{page_num} / {total}")

def watermark_logo(c):
    """Small 'N' logo top-right."""
    cx, cy, r = W - 18*mm, H - 14*mm, 7*mm
    c.setFillColor(NAVY)
    c.circle(cx, cy, r, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(cx, cy - 4, "N")


# ══════════════════════════════════════════════════════════════════════════════
#  BUILD PDF
# ══════════════════════════════════════════════════════════════════════════════
output_path = "/home/user/nabhangan-engg/Nabhangan_Engineers_Features.pdf"
c = canvas.Canvas(output_path, pagesize=A4)
c.setTitle("Nabhangan Engineers — Customized Workflow Management Software")
c.setAuthor("Dr. Nimish Pankhedkar, Chemiligence Solutions")
TOTAL_PAGES = 7


# ══════════════════════════════════════════════════════════════════════════════
#  SLIDE 1 — COVER
# ══════════════════════════════════════════════════════════════════════════════
# Gradient-style background: full NAVY top half, light bottom
c.setFillColor(NAVY)
c.rect(0, H/2, W, H/2, fill=1, stroke=0)
c.setFillColor(LIGHT)
c.rect(0, 0, W, H/2, fill=1, stroke=0)

# Gold accent strip
c.setFillColor(GOLD)
c.rect(0, H/2 - 2*mm, W, 4*mm, fill=1, stroke=0)

# Big N circle
cx_logo, cy_logo = W/2, H * 0.72
c.setFillColor(GOLD)
c.circle(cx_logo, cy_logo, 22*mm, fill=1, stroke=0)
c.setFillColor(NAVY)
c.setFont("Helvetica-Bold", 38)
c.drawCentredString(cx_logo, cy_logo - 13, "N")

# Title block
c.setFillColor(WHITE)
c.setFont("Helvetica-Bold", 22)
c.drawCentredString(W/2, H * 0.72 - 35*mm, "Nabhangan Engineers")
c.setFont("Helvetica", 11)
c.drawCentredString(W/2, H * 0.72 - 43*mm, "Customized Workflow Management Software")

c.setFillColor(GOLD)
c.rect(W/2 - 30*mm, H * 0.72 - 46*mm, 60*mm, 0.5*mm, fill=1, stroke=0)

# Tagline
c.setFillColor(LIGHT)
c.setFont("Helvetica-Oblique", 9)
c.drawCentredString(W/2, H * 0.72 - 52*mm, "End-to-end valuation case management · From lead to dispatch")

# Bottom half — product info
c.setFillColor(NAVY)
c.setFont("Helvetica-Bold", 10)
c.drawCentredString(W/2, H * 0.32, "Built exclusively for civil engineering & valuation firms")
c.setFillColor(SLATE)
c.setFont("Helvetica", 8.5)
c.drawCentredString(W/2, H * 0.32 - 7*mm, "Multi-user · Role-based · Cloud-hosted · Mobile-ready")

# copyright bottom
c.setFillColor(NAVY)
c.rect(0, 0, W, 12*mm, fill=1, stroke=0)
c.setFillColor(WHITE)
c.setFont("Helvetica", 7.5)
c.drawCentredString(W/2, 4.5*mm, "© 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions · All rights reserved")

c.showPage()


# ══════════════════════════════════════════════════════════════════════════════
#  SLIDE 2 — OVERVIEW / WHAT IS IT
# ══════════════════════════════════════════════════════════════════════════════
draw_slide_bg(c, NAVY)
watermark_logo(c)

# Slide title band
c.setFillColor(NAVY)
c.rect(7*mm, H - 28*mm, W - 14*mm, 20*mm, fill=1, stroke=0)
c.setFillColor(WHITE)
c.setFont("Helvetica-Bold", 18)
c.drawString(15*mm, H - 20*mm, "What is It?")
c.setFont("Helvetica", 9)
c.setFillColor(GOLD)
c.drawString(15*mm, H - 26*mm, "A purpose-built platform for managing valuation projects from enquiry to dispatch")

# Three pillar boxes
cols = [(14*mm, 56*mm), (83*mm, 56*mm), (152*mm, 56*mm)]
pillars = [
    ("📋  Case\nManagement",  "Track every project from lead through survey, drafting, checking, print, scan and final dispatch — in one place.",  NAVY),
    ("👥  Team\nCoordination", "Assign stages to specific staff, monitor workloads, control who can work on what and when.",                       NAVY_LT),
    ("📊  Reporting\n& Audit",  "Real-time stage dashboards, per-staff reports, CSV exports, and full project timelines for admin review.",       NAVY),
]
for (px, pw), (title, desc, col) in zip(cols, pillars):
    c.setFillColor(col)
    c.roundRect(px, H - 100*mm, pw, 65*mm, 4, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10)
    ty = H - 52*mm
    for line in title.split("\n"):
        c.drawString(px + 4*mm, ty, line)
        ty -= 6*mm
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 8)
    words = desc.split()
    line_str, dy = "", H - 67*mm
    for w in words:
        if len(line_str) + len(w) + 1 <= 28:
            line_str = (line_str + " " + w).strip()
        else:
            c.drawString(px + 4*mm, dy, line_str)
            dy -= 4.8*mm
            line_str = w
    if line_str:
        c.drawString(px + 4*mm, dy, line_str)

# Key numbers
c.setFillColor(LIGHT)
c.roundRect(14*mm, H - 175*mm, W - 28*mm, 62*mm, 4, fill=1, stroke=0)
c.setFillColor(NAVY)
c.setFont("Helvetica-Bold", 10)
c.drawString(20*mm, H - 122*mm, "Key Numbers at a Glance")
stats = [
    ("8", "Workflow Stages"),
    ("3", "User Roles"),
    ("∞", "Projects"),
    ("100%", "Cloud & Secure"),
    ("1 yr", "File Link Validity"),
]
sx = 20*mm
for val, lbl in stats:
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(sx, H - 145*mm, val)
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 7)
    c.drawString(sx, H - 152*mm, lbl)
    sx += 37*mm

page_footer(c, 2, TOTAL_PAGES)
c.showPage()


# ══════════════════════════════════════════════════════════════════════════════
#  SLIDE 3 — WORKFLOW PIPELINE
# ══════════════════════════════════════════════════════════════════════════════
draw_slide_bg(c, GOLD)
watermark_logo(c)

c.setFillColor(NAVY)
c.rect(7*mm, H - 28*mm, W - 14*mm, 20*mm, fill=1, stroke=0)
c.setFillColor(WHITE)
c.setFont("Helvetica-Bold", 18)
c.drawString(15*mm, H - 20*mm, "8-Stage Workflow Pipeline")
c.setFont("Helvetica", 9)
c.setFillColor(GOLD)
c.drawString(15*mm, H - 26*mm, "Every case follows a controlled sequence — no stage can be skipped")

stages = [
    ("💡", "Lead",           "Case registered — owner, bank, property details captured. Awaits admin approval to proceed.",                        NAVY),
    ("📍", "Survey",         "Site visit report filled: GPS, property dimensions, valuation, photos uploaded. Third-party surveyor link supported.", NAVY_LT),
    ("📊", "Rate Verific.",  "Market rate cross-check and preliminary valuation review by assigned staff.",                                         NAVY),
    ("✏️", "Drafting",       "Full valuation report drafted and formatted by the draughtsman.",                                                     NAVY_LT),
    ("🔍", "Checking",       "Report reviewed for accuracy and compliance before final output.",                                                     NAVY),
    ("🖨️", "Print",          "Hard copies generated and logged.",                                                                                   NAVY_LT),
    ("📷", "Scan",           "Signed, stamped report scanned and archived digitally.",                                                              NAVY),
    ("📬", "Dispatch",       "Final report dispatched to bank / client. Case marked complete.",                                                     GREEN),
]

arrow_y = H - 50*mm
box_w = (W - 22*mm) / 8
bx = 10*mm
for icon, title, desc, col in stages:
    c.setFillColor(col)
    c.roundRect(bx, arrow_y - 12*mm, box_w - 2*mm, 18*mm, 3, fill=1, stroke=0)
    c.setFillColor(GOLD if col != GREEN else WHITE)
    c.setFont("Helvetica", 10)
    c.drawCentredString(bx + box_w/2 - 1*mm, arrow_y, icon)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(bx + box_w/2 - 1*mm, arrow_y - 6*mm, title)
    if bx + box_w < W - 12*mm:
        c.setFillColor(SLATE)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(bx + box_w - 1*mm, arrow_y - 3*mm, "▸")
    bx += box_w

# Description rows
desc_y = H - 80*mm
bx = 10*mm
for icon, title, desc, col in stages:
    c.setFillColor(LIGHT)
    c.roundRect(bx, desc_y - 70*mm, box_w - 2*mm, 68*mm, 3, fill=1, stroke=0)
    c.setFillColor(col)
    c.roundRect(bx, desc_y - 70*mm + 60*mm, box_w - 2*mm, 8*mm, 3, fill=1, stroke=0)
    c.rect(bx, desc_y - 70*mm + 60*mm, box_w - 2*mm, 4*mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(bx + box_w/2 - 1*mm, desc_y - 70*mm + 62.5*mm, title)
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 6)
    words = desc.split()
    ln, dy2 = "", desc_y - 70*mm + 57*mm
    for w in words:
        if len(ln) + len(w) + 1 <= 18:
            ln = (ln + " " + w).strip()
        else:
            c.drawString(bx + 2*mm, dy2, ln)
            dy2 -= 4*mm
            ln = w
    if ln:
        c.drawString(bx + 2*mm, dy2, ln)
    bx += box_w

# Flow control note
c.setFillColor(AMBER)
c.roundRect(14*mm, H - 170*mm, W - 28*mm, 12*mm, 3, fill=1, stroke=0)
c.setFillColor(WHITE)
c.setFont("Helvetica-Bold", 8)
c.drawString(20*mm, H - 164*mm, "⚙  Flow Control:")
c.setFont("Helvetica", 8)
c.drawString(52*mm, H - 164*mm, "Staff assigned to later stages cannot work until all preceding stages are submitted & locked by the admin.")

page_footer(c, 3, TOTAL_PAGES)
c.showPage()


# ══════════════════════════════════════════════════════════════════════════════
#  SLIDE 4 — ROLE-BASED ACCESS & STAFF FEATURES
# ══════════════════════════════════════════════════════════════════════════════
draw_slide_bg(c, NAVY)
watermark_logo(c)

c.setFillColor(NAVY)
c.rect(7*mm, H - 28*mm, W - 14*mm, 20*mm, fill=1, stroke=0)
c.setFillColor(WHITE)
c.setFont("Helvetica-Bold", 18)
c.drawString(15*mm, H - 20*mm, "Role-Based Access & Staff Features")
c.setFont("Helvetica", 9)
c.setFillColor(GOLD)
c.drawString(15*mm, H - 26*mm, "Three roles, clearly separated responsibilities")

role_cards = [
    ("Admin", NAVY, [
        "Full visibility across all cases and staff",
        "Create, edit, approve and delete cases",
        "Assign stages to staff members",
        "Revoke submitted stages for corrections",
        "Generate third-party surveyor links",
        "Download CSV reports (per project + all)",
        "View staff occupancy & workload dashboard",
        "Change staff login email / credentials",
    ]),
    ("Staff", NAVY_LT, [
        "View own assigned cases only",
        "Fill site visit reports with GPS capture",
        "Upload photos & documents (up to 10/case)",
        "Log time spent per stage",
        "Submit checklists to advance the workflow",
        "Request task reassignment from admin",
        "View personalised dashboard with greeting",
        "Download files uploaded to their stages",
    ]),
    ("Third Party", PURPLE, [
        "Access via one-time, time-limited secure link",
        "No login / account required",
        "Full site visit report form access",
        "GPS capture and photo upload",
        "Save draft and submit when ready",
        "Link auto-expires after set duration",
        "Link invalidated after first submission",
        "Tracked by name in assignments & dashboard",
    ]),
]

cx = 14*mm
cw = (W - 28*mm - 8*mm) / 3
for title, col, items in role_cards:
    c.setFillColor(col)
    c.roundRect(cx, H - 210*mm, cw, 175*mm, 4, fill=1, stroke=0)
    c.setFillColor(GOLD if col != PURPLE else WHITE)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(cx + cw/2, H - 48*mm, title)
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 8)
    iy = H - 60*mm
    for item in items:
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(GOLD if col != PURPLE else HexColor("#e9d5ff"))
        c.drawString(cx + 4*mm, iy, "✓")
        c.setFillColor(WHITE)
        c.setFont("Helvetica", 7.5)
        c.drawString(cx + 9*mm, iy, item)
        iy -= 5.5*mm
    cx += cw + 4*mm

page_footer(c, 4, TOTAL_PAGES)
c.showPage()


# ══════════════════════════════════════════════════════════════════════════════
#  SLIDE 5 — REPORTING & INTELLIGENCE
# ══════════════════════════════════════════════════════════════════════════════
draw_slide_bg(c, GOLD)
watermark_logo(c)

c.setFillColor(NAVY)
c.rect(7*mm, H - 28*mm, W - 14*mm, 20*mm, fill=1, stroke=0)
c.setFillColor(WHITE)
c.setFont("Helvetica-Bold", 18)
c.drawString(15*mm, H - 20*mm, "Reporting & Business Intelligence")
c.setFont("Helvetica", 9)
c.setFillColor(GOLD)
c.drawString(15*mm, H - 26*mm, "Know your team's performance and every project's status at a glance")

report_cards = [
    ("Admin Dashboard", NAVY, [
        "Live stage-wise case count tiles (8 stages)",
        "Active vs. closed case summary",
        "Stage distribution bar chart with drill-down",
        "Staff occupancy with load indicators (Free / Light / Moderate / Heavy)",
        "Third-party surveyor active link tracking",
    ]),
    ("Staff Reports", NAVY_LT, [
        "Weekly view: checklists submitted, hours logged",
        "Navigate week-by-week with prev / next controls",
        "All allotted tasks with Completed / Pending status",
        "Select any staff member and view their report",
    ]),
    ("Project Timeline", NAVY, [
        "Per-project: stage × assigned staff × hours × submission date",
        "File count per stage",
        "Total hours aggregated across all stages",
        "Download as CSV (Excel-compatible, UTF-8)",
    ]),
    ("All-Projects CSV Export", NAVY_LT, [
        "One row per project, all stages in columns",
        "Staff name, hours, and submission date per stage",
        "Created by, address, current status included",
        "Instant download from admin Reports page",
    ]),
]

rx, ry_top = 14*mm, H - 40*mm
rw = (W - 28*mm - 4*mm) / 2
rh = 68*mm
for i, (title, col, items) in enumerate(report_cards):
    x = rx + (i % 2) * (rw + 4*mm)
    y = ry_top - (i // 2) * (rh + 4*mm)
    c.setFillColor(LIGHT)
    c.roundRect(x, y - rh, rw, rh, 4, fill=1, stroke=0)
    c.setFillColor(col)
    c.roundRect(x, y - 10*mm, rw, 10*mm, 4, fill=1, stroke=0)
    c.rect(x, y - 6*mm, rw, 6*mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x + 4*mm, y - 7*mm, title)
    iy = y - 15*mm
    for item in items:
        c.setFillColor(col)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawString(x + 4*mm, iy, "▸")
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 7.5)
        words = item.split()
        ln, first = "", True
        for w in words:
            if len(ln) + len(w) + 1 <= 40:
                ln = (ln + " " + w).strip()
            else:
                c.drawString(x + 9*mm, iy, ln)
                iy -= 4.5*mm
                ln = w
                first = False
        if ln:
            c.drawString(x + 9*mm, iy, ln)
        iy -= 5.5*mm

page_footer(c, 5, TOTAL_PAGES)
c.showPage()


# ══════════════════════════════════════════════════════════════════════════════
#  SLIDE 6 — SECURITY, FILES & PLATFORM
# ══════════════════════════════════════════════════════════════════════════════
draw_slide_bg(c, NAVY)
watermark_logo(c)

c.setFillColor(NAVY)
c.rect(7*mm, H - 28*mm, W - 14*mm, 20*mm, fill=1, stroke=0)
c.setFillColor(WHITE)
c.setFont("Helvetica-Bold", 18)
c.drawString(15*mm, H - 20*mm, "Security, Files & Platform")
c.setFont("Helvetica", 9)
c.setFillColor(GOLD)
c.drawString(15*mm, H - 26*mm, "Enterprise-grade security with a cloud-first, mobile-ready architecture")

sections = [
    ("🔒  Security & Access Control", NAVY, [
        ("Role-based access",              "Admin, Staff, Third Party — each sees only what they need"),
        ("Stage-locked submissions",       "Once a stage is submitted it is read-only; admin revokes to re-open"),
        ("Flow-gated workflow",            "Staff for later stages cannot edit until earlier stages are completed"),
        ("One-time third-party links",     "Time-limited, single-use URLs with automatic expiry"),
        ("Supabase Auth",                  "Industry-standard authentication with secure session management"),
    ]),
    ("📂  File Management", NAVY_LT, [
        ("Signed URLs (1-year validity)",  "Files are never publicly accessible — every download is authenticated"),
        ("Up to 10 photos per case",       "Up to 5 MB per photo, uploaded directly from mobile or desktop"),
        ("Stage-organised storage",        "Files grouped by project and stage for easy retrieval"),
        ("Admin delete on closed cases",   "Admin can bulk-delete files once a case is dispatched"),
        ("Third-party photo upload",       "External surveyors can upload site photos via their secure link"),
    ]),
    ("☁️  Platform & Technology", GREEN, [
        ("Next.js 16 App Router",          "Fast, server-rendered pages with zero client-side flicker"),
        ("Supabase (PostgreSQL)",           "Reliable, scalable cloud database with real-time capabilities"),
        ("Hosted on Vercel / cloud",        "Globally distributed CDN, 99.9% uptime"),
        ("Mobile-responsive UI",            "Works on phones, tablets, and desktops equally well"),
        ("CSV Excel exports",              "All reports export with UTF-8 BOM for correct Indian character display"),
    ]),
]

sx = 14*mm
sw = (W - 28*mm - 8*mm) / 3
for title, col, items in sections:
    c.setFillColor(LIGHT)
    c.roundRect(sx, H - 230*mm, sw, 195*mm, 4, fill=1, stroke=0)
    c.setFillColor(col)
    c.roundRect(sx, H - 50*mm, sw, 14*mm, 4, fill=1, stroke=0)
    c.rect(sx, H - 43*mm, sw, 7*mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(sx + 3*mm, H - 43*mm + 1*mm, title)
    iy = H - 57*mm
    for feat, desc in items:
        c.setFillColor(col)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawString(sx + 3*mm, iy, feat)
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 7)
        words = desc.split()
        ln, dy2 = "", iy - 4*mm
        for w in words:
            if len(ln) + len(w) + 1 <= 30:
                ln = (ln + " " + w).strip()
            else:
                c.drawString(sx + 3*mm, dy2, ln)
                dy2 -= 4*mm
                ln = w
        if ln:
            c.drawString(sx + 3*mm, dy2, ln)
        iy = dy2 - 5*mm
    sx += sw + 4*mm

page_footer(c, 6, TOTAL_PAGES)
c.showPage()


# ══════════════════════════════════════════════════════════════════════════════
#  SLIDE 7 — CLOSING / CONTACT
# ══════════════════════════════════════════════════════════════════════════════
c.setFillColor(NAVY)
c.rect(0, 0, W, H, fill=1, stroke=0)

# Gold bar accent top
c.setFillColor(GOLD)
c.rect(0, H - 3*mm, W, 3*mm, fill=1, stroke=0)

# Centre logo
cx_l, cy_l = W/2, H * 0.70
c.setFillColor(GOLD)
c.circle(cx_l, cy_l, 18*mm, fill=1, stroke=0)
c.setFillColor(NAVY)
c.setFont("Helvetica-Bold", 28)
c.drawCentredString(cx_l, cy_l - 10, "N")

c.setFillColor(WHITE)
c.setFont("Helvetica-Bold", 20)
c.drawCentredString(W/2, H * 0.70 - 30*mm, "Nabhangan Engineers")
c.setFont("Helvetica", 10)
c.setFillColor(GOLD)
c.drawCentredString(W/2, H * 0.70 - 38*mm, "Customized Workflow Management Software")

# Divider
c.setFillColor(GOLD)
c.rect(W/2 - 25*mm, H * 0.70 - 42*mm, 50*mm, 0.5*mm, fill=1, stroke=0)

# Feature summary pills
pills = ["8 Workflow Stages", "Role-Based Access", "Third-Party Links",
         "Real-Time Reports", "1-Year File URLs", "CSV Excel Exports",
         "Staff Occupancy", "Mobile Ready"]
pill_y = H * 0.70 - 60*mm
pill_x = 18*mm
row_count = 0
for pill in pills:
    pw = len(pill) * 4.5 + 8
    if pill_x + pw*mm > W - 18*mm:
        pill_x = 18*mm
        pill_y -= 10*mm
    c.setFillColor(NAVY_LT)
    c.roundRect(pill_x, pill_y, pw*mm, 7*mm, 3.5, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(pill_x + 3*mm, pill_y + 2*mm, pill)
    pill_x += pw*mm + 3*mm

# Contact / copyright block
c.setFillColor(GOLD)
c.rect(0, 28*mm, W, 0.5*mm, fill=1, stroke=0)

c.setFillColor(WHITE)
c.setFont("Helvetica-Bold", 11)
c.drawCentredString(W/2, 23*mm, "Dr. Nimish Pankhedkar")
c.setFont("Helvetica", 8.5)
c.setFillColor(HexColor("#94a3b8"))
c.drawCentredString(W/2, 17*mm, "Chemiligence Solutions")
c.setFont("Helvetica", 7.5)
c.drawCentredString(W/2, 11*mm, "© 2026 · All rights reserved · Software developed exclusively for Nabhangan Engineers")

c.showPage()


c.save()
print(f"✅  PDF saved to: {output_path}")
