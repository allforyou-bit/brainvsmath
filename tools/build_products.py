"""Builds the two launch PDF products into PRODUCTS/ (git-ignored).

  Product A: Multiplication Mastery Pack  (60 worksheets + answer keys)
  Product B: The Daily Target Puzzle Book, Vol. 1  (100 puzzles + solutions)

Run:  python tools/build_products.py
Deterministic: every sheet/puzzle is seeded, so a re-run reproduces byte-similar content.
"""
import json
import os
import random

from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "PRODUCTS")
os.makedirs(OUT, exist_ok=True)

W, H = letter                     # 612 x 792 pt
M = 54                            # 0.75" margin
NAVY = HexColor("#0b1220")
SURFACE = HexColor("#1a2438")
PINK = HexColor("#f472b6")
CYAN = HexColor("#22d3ee")
GREY = HexColor("#5b6b82")
LIGHT = HexColor("#eef2f8")
SITE = "allforyou-bit.github.io/brainvsmath"
BRAND = "BRAIN vs MATH"

MUL = "\xd7"   # × (WinAnsi-safe)
DIV = "\xf7"   # ÷ (WinAnsi-safe)


# ----------------------------------------------------------------------
# shared drawing helpers
# ----------------------------------------------------------------------
def cover(c, product_title, subtitle, badge, tile_nums):
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    # brand
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(PINK)
    bw = c.stringWidth("BRAIN ", "Helvetica-Bold", 16)
    vw = c.stringWidth("vs ", "Helvetica-Bold", 16)
    total = bw + vw + c.stringWidth("MATH", "Helvetica-Bold", 16)
    x0 = (W - total) / 2
    c.drawString(x0, H - 90, "BRAIN ")
    c.setFillColor(GREY)
    c.drawString(x0 + bw, H - 90, "vs ")
    c.setFillColor(CYAN)
    c.drawString(x0 + bw + vw, H - 90, "MATH")
    # title
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 40)
    lines = product_title.split("\n")
    y = H - 250
    for ln in lines:
        c.drawCentredString(W / 2, y, ln)
        y -= 48
    # accent bar
    c.setFillColor(PINK)
    c.rect(W / 2 - 90, y + 18, 84, 5, stroke=0, fill=1)
    c.setFillColor(CYAN)
    c.rect(W / 2 + 6, y + 18, 84, 5, stroke=0, fill=1)
    # subtitle
    c.setFillColor(HexColor("#c9d6ea"))
    c.setFont("Helvetica", 15)
    yy = y - 16
    for ln in subtitle.split("\n"):
        c.drawCentredString(W / 2, yy, ln)
        yy -= 22
    # tile motif
    n = len(tile_nums)
    tw, gap = 62, 12
    tx = (W - (n * tw + (n - 1) * gap)) / 2
    ty = 250
    for i, v in enumerate(tile_nums):
        x = tx + i * (tw + gap)
        c.setFillColor(SURFACE)
        c.setStrokeColor(HexColor("#39496b"))
        c.roundRect(x, ty, tw, tw, 10, stroke=1, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 22)
        c.drawCentredString(x + tw / 2, ty + tw / 2 - 8, str(v))
    # badge + site
    c.setFillColor(PINK)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(W / 2, 180, badge)
    c.setFillColor(GREY)
    c.setFont("Helvetica", 11)
    c.drawCentredString(W / 2, 70, "Play free daily puzzles at " + SITE)
    c.showPage()


def license_block(c, y):
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(black)
    c.drawString(M, y, "License (please read)")
    c.setFont("Helvetica", 10.5)
    c.setFillColor(HexColor("#333333"))
    lines = [
        "This PDF is licensed to the purchaser for PERSONAL and SINGLE-CLASSROOM use.",
        "You may print unlimited copies for your own students, children, or tutees.",
        "You may not resell, redistribute, or post this file (or its pages) online.",
        "School-wide or district licenses: contact us via the website.",
        "",
        "(c) 2026 Brain vs Math - " + SITE,
    ]
    for ln in lines:
        y -= 16
        c.drawString(M, y, ln)
    return y


def footer(c, page_label):
    c.setFont("Helvetica", 8.5)
    c.setFillColor(GREY)
    c.drawCentredString(W / 2, 30, page_label + "  |  " + BRAND + "  |  " + SITE)


# ----------------------------------------------------------------------
# Product A - Multiplication Mastery Pack
# ----------------------------------------------------------------------
def sheet_header(c, num, title, subtitle, name_line=True):
    c.setFillColor(NAVY)
    c.rect(0, H - 26, W, 26, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(M, H - 18, BRAND)
    c.drawRightString(W - M, H - 18, "Sheet %02d" % num)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 19)
    c.drawString(M, H - 62, title)
    c.setFillColor(GREY)
    c.setFont("Helvetica", 11)
    c.drawString(M, H - 80, subtitle)
    if name_line:
        c.setFont("Helvetica", 10.5)
        c.setFillColor(HexColor("#333333"))
        c.drawString(M, H - 106, "Name: ______________________________       Date: ______________       Score: ______")
    c.setStrokeColor(HexColor("#bbbbbb"))
    c.line(M, H - 118, W - M, H - 118)


def draw_problems_2col(c, problems, top=H - 150, fsize=14, rowgap=31):
    half = (len(problems) + 1) // 2
    for i, p in enumerate(problems):
        col = 0 if i < half else 1
        row = i if i < half else i - half
        x = M + col * ((W - 2 * M) / 2 + 10)
        y = top - row * rowgap
        c.setFont("Helvetica", 10)
        c.setFillColor(GREY)
        c.drawString(x, y, "%d)" % (i + 1))
        c.setFont("Helvetica", fsize)
        c.setFillColor(black)
        c.drawString(x + 26, y, p + " = __________")


def gen_pack():
    path = os.path.join(OUT, "Multiplication-Mastery-Pack-v1.pdf")
    c = canvas.Canvas(path, pagesize=letter)
    c.setTitle("Multiplication Mastery Pack - 60 Printable Worksheets")
    c.setAuthor("Brain vs Math")

    cover(
        c,
        "Multiplication\nMastery Pack",
        "60 no-prep printable worksheets with full answer keys\nTables 2-12  |  mixed practice  |  division facts  |  speed drills",
        "60 WORKSHEETS  +  ANSWER KEYS  |  GRADES 3-5",
        [7, 8, 56, 6, 9, 54],
    )

    # intro / license page
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(black)
    c.drawString(M, H - 90, "How to use this pack")
    c.setFont("Helvetica", 11)
    c.setFillColor(HexColor("#333333"))
    intro = [
        "The pack is ordered as a 4-week program, but every sheet stands alone:",
        "",
        "  Sheets 01-33   Table focus (2s-12s) - three variants per table (A, B, C-missing factor)",
        "  Sheets 34-42   Mixed practice - easy, medium, hard",
        "  Sheets 43-48   Division facts - the inverse check that locks tables in",
        "  Sheets 49-54   2-digit x 1-digit - first written-method stretch",
        "  Sheets 55-60   50-fact speed drills - time box included, beat yesterday",
        "",
        "Answer keys for every sheet start right after Sheet 60.",
        "Tip: 10 minutes a day beats an hour on Sunday. Pair with the free daily",
        "puzzle at " + SITE + " for warm-up.",
    ]
    y = H - 120
    for ln in intro:
        c.drawString(M, y, ln)
        y -= 16
    license_block(c, y - 18)
    footer(c, "Intro")
    c.showPage()

    keys = []  # (sheet_no, title, [answers])
    sheet_no = 0

    # --- 1) table focus: 2..12 x (A, B, C) ---
    for table in range(2, 13):
        for variant in ("A", "B", "C"):
            sheet_no += 1
            rnd = random.Random("pack-t%d-%s" % (table, variant))
            probs, answers = [], []
            if variant in ("A", "B"):
                facts = [(table, i) for i in range(1, 13)] + [(i, table) for i in rnd.sample(range(1, 13), 12)]
                rnd.shuffle(facts)
                for a, b in facts:
                    probs.append("%d %s %d" % (a, MUL, b))
                    answers.append(a * b)
                title = "The %ds - Practice %s" % (table, variant)
                sub = "24 problems on the %d times table (both directions)." % table
            else:
                facts = [(table, i) for i in range(1, 13)] * 2
                rnd.shuffle(facts)
                facts = facts[:24]
                for a, b in facts:
                    probs.append("%d %s ____" % (a, MUL) + "  , answer %d" % (a * b))
                title = "The %ds - Missing Factor" % table
                sub = "Fill in the missing factor. This is where the table really sticks."
                # rebuild: missing factor rendering needs custom line
            sheet_header(c, sheet_no, title, sub)
            if variant == "C":
                # custom draw for missing factor
                items = []
                for a, b in facts:
                    items.append(("%d %s ______ = %d" % (a, MUL, a * b)))
                    answers.append(b)
                half = (len(items) + 1) // 2
                for i, p in enumerate(items):
                    col = 0 if i < half else 1
                    row = i if i < half else i - half
                    x = M + col * ((W - 2 * M) / 2 + 10)
                    y = H - 150 - row * 31
                    c.setFont("Helvetica", 10)
                    c.setFillColor(GREY)
                    c.drawString(x, y, "%d)" % (i + 1))
                    c.setFont("Helvetica", 14)
                    c.setFillColor(black)
                    c.drawString(x + 26, y, p)
            else:
                draw_problems_2col(c, probs)
            footer(c, "Sheet %02d" % sheet_no)
            c.showPage()
            keys.append((sheet_no, title, answers))

    # --- 2) mixed practice: 9 sheets ---
    levels = [("Easy", 2, 5), ("Easy", 2, 5), ("Easy", 2, 5),
              ("Medium", 2, 9), ("Medium", 2, 9), ("Medium", 2, 9),
              ("Hard", 2, 12), ("Hard", 2, 12), ("Hard", 2, 12)]
    for idx, (lvl, lo, hi) in enumerate(levels):
        sheet_no += 1
        rnd = random.Random("pack-mix-%d" % idx)
        probs, answers = [], []
        for _ in range(24):
            a, b = rnd.randint(lo, hi), rnd.randint(2, 12)
            probs.append("%d %s %d" % (a, MUL, b))
            answers.append(a * b)
        title = "Mixed Tables - %s %d" % (lvl, idx % 3 + 1)
        sheet_header(c, sheet_no, title, "24 mixed problems, tables %d-%d." % (lo, hi))
        draw_problems_2col(c, probs)
        footer(c, "Sheet %02d" % sheet_no)
        c.showPage()
        keys.append((sheet_no, title, answers))

    # --- 3) division facts: 6 sheets ---
    for idx in range(6):
        sheet_no += 1
        rnd = random.Random("pack-div-%d" % idx)
        probs, answers = [], []
        for _ in range(24):
            b = rnd.randint(2, 12)
            q = rnd.randint(2, 12)
            probs.append("%d %s %d" % (b * q, DIV, b))
            answers.append(q)
        title = "Division Facts %d" % (idx + 1)
        sheet_header(c, sheet_no, title, "Division is multiplication in reverse - every answer is exact.")
        draw_problems_2col(c, probs)
        footer(c, "Sheet %02d" % sheet_no)
        c.showPage()
        keys.append((sheet_no, title, answers))

    # --- 4) 2-digit x 1-digit: 6 sheets ---
    for idx in range(6):
        sheet_no += 1
        rnd = random.Random("pack-2d-%d" % idx)
        probs, answers = [], []
        for _ in range(16):
            a, b = rnd.randint(12, 99), rnd.randint(3, 9)
            probs.append("%d %s %d" % (a, MUL, b))
            answers.append(a * b)
        title = "2-Digit Stretch %d" % (idx + 1)
        sheet_header(c, sheet_no, title, "16 problems - use the written method or smart splitting (e.g. 47x6 = 40x6 + 7x6).")
        draw_problems_2col(c, probs, rowgap=40, fsize=15)
        footer(c, "Sheet %02d" % sheet_no)
        c.showPage()
        keys.append((sheet_no, title, answers))

    # --- 5) speed drills: 6 sheets of 50 ---
    for idx in range(6):
        sheet_no += 1
        rnd = random.Random("pack-speed-%d" % idx)
        facts, answers = [], []
        for _ in range(50):
            a, b = rnd.randint(2, 12), rnd.randint(2, 12)
            facts.append((a, b))
            answers.append(a * b)
        title = "Speed Drill %d - 50 facts" % (idx + 1)
        sheet_header(c, sheet_no, title, "Race the clock: write only answers. Time box below - beat your last run.", name_line=False)
        c.setFont("Helvetica", 11)
        c.setFillColor(HexColor("#333333"))
        c.drawString(M, H - 106, "Name: ____________________   Time: ______ : ______      Correct: ______ / 50")
        cols, rows = 5, 10
        cw = (W - 2 * M) / cols
        for i, (a, b) in enumerate(facts):
            col, row = i % cols, i // cols
            x = M + col * cw
            y = H - 150 - row * 52
            c.setFont("Helvetica", 8.5)
            c.setFillColor(GREY)
            c.drawString(x, y + 14, "%d)" % (i + 1))
            c.setFont("Helvetica", 13)
            c.setFillColor(black)
            c.drawString(x + 2, y, "%d %s %d =" % (a, MUL, b))
            c.setStrokeColor(HexColor("#999999"))
            c.line(x + 2, y - 14, x + cw - 16, y - 14)
        footer(c, "Sheet %02d" % sheet_no)
        c.showPage()
        keys.append((sheet_no, title, answers))

    # --- answer keys: 4 sheets per page ---
    per_page = 4
    for start in range(0, len(keys), per_page):
        chunk = keys[start:start + per_page]
        c.setFillColor(NAVY)
        c.rect(0, H - 26, W, 26, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(M, H - 18, BRAND + " - ANSWER KEYS")
        y = H - 56
        for sheet, title, answers in chunk:
            c.setFont("Helvetica-Bold", 12)
            c.setFillColor(black)
            c.drawString(M, y, "Sheet %02d - %s" % (sheet, title))
            y -= 16
            c.setFont("Helvetica", 9.5)
            c.setFillColor(HexColor("#333333"))
            line = "   ".join("%d)%s" % (i + 1, v) for i, v in enumerate(answers))
            # wrap
            words = line.split("   ")
            cur = ""
            for wd in words:
                if c.stringWidth(cur + wd + "   ", "Helvetica", 9.5) > W - 2 * M:
                    c.drawString(M, y, cur.rstrip())
                    y -= 13
                    cur = ""
                cur += wd + "   "
            if cur.strip():
                c.drawString(M, y, cur.rstrip())
                y -= 13
            y -= 14
        footer(c, "Answer keys")
        c.showPage()

    c.save()
    return path, sheet_no


# ----------------------------------------------------------------------
# Product B - Daily Target Puzzle Book Vol. 1
# ----------------------------------------------------------------------
def draw_puzzle(c, p, y_top):
    """Draws one puzzle in the half-page slot whose TOP edge is y_top."""
    box_h = 300
    y0 = y_top - box_h
    c.setStrokeColor(HexColor("#cccccc"))
    c.roundRect(M, y0, W - 2 * M, box_h, 10, stroke=1, fill=0)
    # header line
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(GREY)
    c.drawString(M + 16, y_top - 26, "#%03d" % p["n"])
    c.setFillColor(PINK if p["tier"] >= 4 else CYAN)
    c.drawRightString(W - M - 16, y_top - 26, p["tierName"].upper())
    # target
    c.setFillColor(black)
    c.setFont("Helvetica", 10)
    c.drawCentredString(W / 2, y_top - 46, "TARGET")
    c.setFont("Helvetica-Bold", 34)
    c.drawCentredString(W / 2, y_top - 82, str(p["target"]))
    # tiles
    n = 6
    tw, gap = 56, 10
    tx = (W - (n * tw + (n - 1) * gap)) / 2
    ty = y_top - 160
    for i, v in enumerate(p["nums"]):
        x = tx + i * (tw + gap)
        c.setFillColor(LIGHT)
        c.setStrokeColor(HexColor("#8a97ab"))
        c.roundRect(x, ty, tw, 44, 8, stroke=1, fill=1)
        c.setFillColor(black)
        c.setFont("Helvetica-Bold", 17)
        c.drawCentredString(x + tw / 2, ty + 15, str(v))
    # work lines
    c.setStrokeColor(HexColor("#d8d8d8"))
    for i in range(3):
        yy = y_top - 205 - i * 30
        c.line(M + 30, yy, W - M - 30, yy)
    c.setFont("Helvetica", 8.5)
    c.setFillColor(GREY)
    c.drawCentredString(W / 2, y0 + 12, "Combine numbers with + - %s %s to hit the target. Each number may be used once." % (MUL, DIV))


def gen_book():
    with open(os.path.join(OUT, "puzzles-vol1.json"), encoding="utf-8") as f:
        puzzles = json.load(f)

    path = os.path.join(OUT, "Daily-Target-Puzzle-Book-Vol1.pdf")
    c = canvas.Canvas(path, pagesize=letter)
    c.setTitle("The Daily Target Puzzle Book, Vol. 1 - 100 Number Puzzles")
    c.setAuthor("Brain vs Math")

    cover(
        c,
        "The Daily Target\nPuzzle Book",
        "100 number puzzles from Warm-up to Expert\nSharpen mental math anywhere - no screen required",
        "VOLUME 1  |  100 PUZZLES + FULL SOLUTIONS",
        [75, 8, 3, 50, 6, 9],
    )

    # how to play + license
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(black)
    c.drawString(M, H - 90, "How to play")
    c.setFont("Helvetica", 11)
    c.setFillColor(HexColor("#333333"))
    rules = [
        "You get six numbers and one target.",
        "",
        "  1. Pick two numbers and combine them with +, -, %s or %s." % (MUL, DIV),
        "  2. The result becomes a new number you can use again.",
        "  3. Reach the target exactly. You do not have to use every number.",
        "",
        "House rules: division must be exact (no fractions) and no step may go",
        "below 1. Every puzzle in this book is solvable - full solutions are in",
        "the back, but try the work lines first.",
        "",
        "Example:  numbers 2, 3, 4, 4, 9, 9 - target 12   ->   4 %s 3 = 12. Done!" % MUL,
        "",
        "A new free puzzle drops every day at " + SITE,
    ]
    y = H - 120
    for ln in rules:
        c.drawString(M, y, ln)
        y -= 16
    license_block(c, y - 18)
    footer(c, "How to play")
    c.showPage()

    # chapters
    tiers = ["Warm-up", "Easy", "Medium", "Hard", "Expert"]
    tips = {
        "Warm-up": "Two moves is usually all it takes. Look for a times-table fact first.",
        "Easy": "Scan for pairs that multiply near the target, then adjust with + or -.",
        "Medium": "Work backwards: is the target divisible by one of your numbers?",
        "Hard": "Build a big anchor (like 25 %s 8) first, then fine-tune." % MUL,
        "Expert": "Five moves deep - keep intermediate results tidy and trust the process.",
    }
    for t_idx, tname in enumerate(tiers):
        # divider
        c.setFillColor(NAVY)
        c.rect(0, 0, W, H, stroke=0, fill=1)
        c.setFillColor(GREY)
        c.setFont("Helvetica-Bold", 13)
        c.drawCentredString(W / 2, H / 2 + 70, "CHAPTER %d" % (t_idx + 1))
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 38)
        c.drawCentredString(W / 2, H / 2 + 20, tname)
        c.setFillColor(CYAN if t_idx < 3 else PINK)
        c.setFont("Helvetica", 13)
        c.drawCentredString(W / 2, H / 2 - 20, "Puzzles %d - %d" % (t_idx * 20 + 1, t_idx * 20 + 20))
        c.setFillColor(HexColor("#c9d6ea"))
        c.setFont("Helvetica-Oblique", 11)
        c.drawCentredString(W / 2, H / 2 - 60, tips[tname])
        c.showPage()

        chapter = [p for p in puzzles if p["tier"] == t_idx + 1]
        for i in range(0, len(chapter), 2):
            draw_puzzle(c, chapter[i], H - 60)
            if i + 1 < len(chapter):
                draw_puzzle(c, chapter[i + 1], H - 420)
            footer(c, "%s - puzzles %d-%d" % (tname, chapter[i]["n"], chapter[min(i + 1, len(chapter) - 1)]["n"]))
            c.showPage()

    # solutions
    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(black)
    c.drawCentredString(W / 2, H - 90, "Solutions")
    c.setFont("Helvetica", 10.5)
    c.setFillColor(GREY)
    c.drawCentredString(W / 2, H - 112, "One valid path per puzzle - many puzzles have several. Found a shorter one? You win.")
    y = H - 150
    c.setFillColor(black)
    for p in puzzles:
        line = "#%03d  (target %d):  %s" % (p["n"], p["target"], ";  ".join(p["solution"]))
        line = line.replace("−", "-")
        c.setFont("Helvetica", 9.5)
        if y < 60:
            footer(c, "Solutions")
            c.showPage()
            y = H - 70
        c.drawString(M, y, line)
        y -= 15
    footer(c, "Solutions")
    c.showPage()

    c.save()
    return path, len(puzzles)


if __name__ == "__main__":
    p1, sheets = gen_pack()
    print("OK pack:", p1, "(%d sheets)" % sheets)
    p2, count = gen_book()
    print("OK book:", p2, "(%d puzzles)" % count)
