"""Lantern Box Games logo, final set (direction C, the LB plaque).
Outlined SVGs, so no font is needed to show them. Colours are Lantern Box design system tokens (version 11),
plus the two in-between stops the round 1 mark already used (#d9913f, the plum of night-sky-2).
Usage: python3 -I final.py <fonts dir> <out dir>"""
import sys, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONTS, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

INK, BRASS, BRASS_DIM, BRASS_DEEP, HEADING = "#060508", "#c9a25a", "#8a7046", "#5a4a36", "#f1d79a"
GOLD, STRING, LGLOW, S2, TEXT3, PARCH = "#ffcf6a", "#fff1c8", "#ffc96a", "#57284f", "#b9ab97", "#efe6d8"
PLAQUE = "#0e090b"  # plaque-face, rgba(14,9,11,0.95), made solid so the strip works on any ground


class Face:
    def __init__(self, path):
        self.f = TTFont(path)
        self.gs = self.f.getGlyphSet()
        self.cmap = self.f.getBestCmap()
        self.hmtx = self.f["hmtx"]
        self.upm = self.f["head"].unitsPerEm
        self.cap = getattr(self.f["OS/2"], "sCapHeight", 0) or self.upm * 0.68

    def width(self, s, size, track=0.0):
        sc = size / self.upm
        return sum(self.hmtx[self.cmap[ord(c)]][0] * sc for c in s) + track * (len(s) - 1)

    def capw(self, size):
        return self.cap * size / self.upm

    def path(self, s, size, x, y, track=0.0):
        sc = size / self.upm
        out = []
        for c in s:
            gn = self.cmap[ord(c)]
            pen = SVGPathPen(self.gs, ntos=lambda v: ("%.2f" % v).rstrip("0").rstrip("."))
            self.gs[gn].draw(TransformPen(pen, (sc, 0, 0, -sc, x, y)))
            if pen.getCommands():
                out.append(pen.getCommands())
            x += self.hmtx[gn][0] * sc + track
        return " ".join(out)


FELL = Face(os.path.join(FONTS, "IMFellEnglish-Regular.woff2"))
SANS = Face(os.path.join(FONTS, "AlegreyaSans-Bold.woff2"))


def chamfer(x, y, w, h, c):
    return (f"{x+c:.2f},{y:.2f} {x+w-c:.2f},{y:.2f} {x+w:.2f},{y+c:.2f} {x+w:.2f},{y+h-c:.2f} "
            f"{x+w-c:.2f},{y+h:.2f} {x+c:.2f},{y+h:.2f} {x:.2f},{y+h-c:.2f} {x:.2f},{y+c:.2f}")


def inset(d, c=10.0, s=100.0):
    """The plaque outline moved in by d (the 45-degree corner shortens by d * (2 - sqrt 2))."""
    return chamfer(d, d, s - 2 * d, s - 2 * d, c - d * 0.5858)


def poly_d(points):
    return "M" + " L".join(points.split()) + " Z"


def svg(w, h, body, defs="", title="Lantern Box Games"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}" width="{w:.0f}" height="{h:.0f}" '
            f'role="img" aria-label="{title}"><title>{title}</title><defs>{defs}</defs>{body}</svg>')


LB_SIZE, LB_TRACK, LB_BASE = 62, -1.5, 64


def lb(size=LB_SIZE, base=LB_BASE):
    track = LB_TRACK * size / LB_SIZE
    w = FELL.width("LB", size, track)
    return FELL.path("LB", size, 50 - w / 2, base, track)


RULE = (f'<rect x="24" y="79.4" width="20.5" height="1.2" fill="{BRASS_DIM}"/>'
        f'<rect x="55.5" y="79.4" width="20.5" height="1.2" fill="{BRASS_DIM}"/>'
        f'<polygon points="50,76.6 53.4,80 50,83.4 46.6,80" fill="{BRASS}"/>')


# ---------- the mark, full colour (48 px tall and up): unchanged from round 1 ----------
def mark(p="m"):
    defs = f"""
<radialGradient id="{p}lit" cx="50" cy="45" r="30" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="{STRING}"/><stop offset="0.55" stop-color="{GOLD}"/><stop offset="1" stop-color="#d9913f"/></radialGradient>
<radialGradient id="{p}back" cx="50" cy="46" r="40" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="{S2}"/><stop offset="1" stop-color="{INK}"/></radialGradient>
<filter id="{p}blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter>"""
    letters = lb()
    body = f"""
<polygon points="{chamfer(0,0,100,100,10)}" fill="url(#{p}back)"/>
<path d="{letters}" fill="{LGLOW}" opacity="0.75" filter="url(#{p}blur)"/>
<path d="{letters}" fill="url(#{p}lit)"/>
{RULE}
<polygon points="{inset(1.2)}" fill="none" stroke="{BRASS}" stroke-width="2.4"/>"""
    return 100, 100, defs, body


# ---------- the small mark (under 48 px, and the profile picture): no rule, bigger letters, no blur, thicker edge ----------
SMALL_SIZE = 64


def mark_small(p="s"):
    base = 50 + FELL.capw(SMALL_SIZE) / 2 + 0.5
    defs = f"""
<radialGradient id="{p}lit" cx="50" cy="44" r="40" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="{STRING}"/><stop offset="0.5" stop-color="{GOLD}"/><stop offset="1" stop-color="#e09a45"/></radialGradient>
<radialGradient id="{p}back" cx="50" cy="48" r="44" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="{S2}"/><stop offset="1" stop-color="{INK}"/></radialGradient>"""
    body = f"""
<polygon points="{chamfer(0,0,100,100,10)}" fill="url(#{p}back)"/>
<path d="{lb(SMALL_SIZE, base)}" fill="url(#{p}lit)"/>
<polygon points="{inset(2.0)}" fill="none" stroke="{BRASS}" stroke-width="4.0"/>"""
    return 100, 100, defs, body


# ---------- one colour: a solid plaque with the edge line, LB, rule and diamond cut out ----------
def mark_mono(colour, p=""):
    parts = [poly_d(chamfer(0, 0, 100, 100, 10)), poly_d(inset(3.0)), poly_d(inset(5.0)), lb(),
             "M24 79.4 H44.5 V80.6 H24 Z", "M55.5 79.4 H76 V80.6 H55.5 Z", "M50 76.6 L53.4 80 L50 83.4 L46.6 80 Z"]
    body = f'<path d="{" ".join(parts)}" fill="{colour}" fill-rule="evenodd"/>'
    return 100, 100, "", body


def mark_mono_small(colour, p=""):
    base = 50 + FELL.capw(SMALL_SIZE) / 2 + 0.5
    parts = [poly_d(chamfer(0, 0, 100, 100, 10)), poly_d(inset(3.4)), poly_d(inset(6.0)), lb(SMALL_SIZE, base)]
    body = f'<path d="{" ".join(parts)}" fill="{colour}" fill-rule="evenodd"/>'
    return 100, 100, "", body


# ---------- the name: "Lantern Box" over GAMES, GAMES between two brass rules ----------
NSIZE, SSIZE = 52, 17
STRACK = 0.26 * SSIZE


def words(x, top, name_col, sub_col, rule_col, align="left"):
    nw = FELL.width("Lantern Box", NSIZE)
    gw = SANS.width("GAMES", SSIZE, STRACK)
    nx = x - nw / 2 if align == "center" else x
    nb = top + FELL.capw(NSIZE)
    sb = nb + 26
    gx = nx + (nw - gw) / 2
    ly = sb - SANS.capw(SSIZE) / 2 - 0.6
    out = (f'<path d="{FELL.path("Lantern Box", NSIZE, nx, nb)}" fill="{name_col}"/>'
           f'<path d="{SANS.path("GAMES", SSIZE, gx, sb, STRACK)}" fill="{sub_col}"/>'
           f'<rect x="{nx+2:.1f}" y="{ly:.1f}" width="{gx-12-nx-2:.1f}" height="1.2" fill="{rule_col}"/>'
           f'<rect x="{gx+gw+12:.1f}" y="{ly:.1f}" width="{nx+nw-gx-gw-14:.1f}" height="1.2" fill="{rule_col}"/>')
    return out, nw, sb


COLOURS = {  # name, GAMES, rules
    "dark": (HEADING, BRASS, BRASS_DIM),
    "light": (INK, BRASS_DEEP, BRASS_DIM),
    "mono-ink": (INK, INK, INK),
    "mono-brass": (BRASS, BRASS, BRASS),
}


def mark_for(ground, p, small=False):
    if ground.startswith("mono"):
        col = COLOURS[ground][0]
        return (mark_mono_small if small else mark_mono)(col, p)
    return (mark_small if small else mark)(p)


def lockup_h(ground):
    _, _, defs, body = mark_for(ground, "h" + ground.replace("-", ""))
    txt, nw, _ = words(122, 24, *COLOURS[ground])
    return 122 + nw + 2, 100, defs, body + txt


def lockup_s(ground):
    _, _, defs, body = mark_for(ground, "v" + ground.replace("-", ""))
    nw = FELL.width("Lantern Box", NSIZE)
    W = nw + 8
    mark_g = f'<g transform="translate({(W-110)/2:.2f},0) scale(1.1)">{body}</g>'
    txt, _, sb = words(W / 2, 132, *COLOURS[ground], align="center")
    return W, sb + 6, defs, mark_g + txt


def credit_strip():
    """'Made by' over the dark lockup, on a plaque-face panel with a brass edge: for the game's credits."""
    lw, lh, defs, body = lockup_h("dark")
    k = 0.8
    pad = 30
    W = lw * k + pad * 2
    H = 46 + lh * k + 24
    msize, mtrack = 13, 0.14 * 13
    mw = SANS.width("MADE BY", msize, mtrack)
    made = SANS.path("MADE BY", msize, (W - mw) / 2, 30, mtrack)
    out = (f'<polygon points="{chamfer(0,0,W,H,8)}" fill="{PLAQUE}"/>'
           f'<polygon points="{chamfer(0.9,0.9,W-1.8,H-1.8,7.5)}" fill="none" stroke="{BRASS}" stroke-width="1.8"/>'
           f'<path d="{made}" fill="{TEXT3}"/>'
           f'<g transform="translate({pad:.2f},46) scale({k})">{body}</g>')
    return W, H, defs, out


def avatar():
    """Square profile picture: the small mark on ink, sized so a round crop never cuts the plaque's corners."""
    _, _, defs, body = mark_small("av")
    k = 0.74
    off = (100 - 100 * k) / 2
    return 100, 100, defs, f'<rect width="100" height="100" fill="{INK}"/><g transform="translate({off:.2f},{off:.2f}) scale({k})">{body}</g>'


def write(name, spec):
    w, h, defs, body = spec
    with open(os.path.join(OUT, name), "w") as fh:
        fh.write(svg(w, h, body, defs))


write("lbg-mark.svg", mark())
write("lbg-mark-small.svg", mark_small())
for g in ("mono-ink", "mono-brass"):
    write(f"lbg-mark-{g}.svg", mark_mono(COLOURS[g][0]))
    write(f"lbg-mark-small-{g}.svg", mark_mono_small(COLOURS[g][0]))
for g in ("dark", "light", "mono-ink", "mono-brass"):
    write(f"lbg-lockup-h-{g}.svg", lockup_h(g))
for g in ("dark", "light"):
    write(f"lbg-lockup-s-{g}.svg", lockup_s(g))
write("lbg-credit.svg", credit_strip())
write("lbg-avatar.svg", avatar())
for n in sorted(os.listdir(OUT)):
    print(f"{os.path.getsize(os.path.join(OUT, n)):>7}  {n}")
