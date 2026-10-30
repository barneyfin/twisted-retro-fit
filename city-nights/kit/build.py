#!/usr/bin/env python3
"""City Nights build. Copied from Retro Kit's build (kit/build.py) and adapted.

Turns each City Nights game's source (city-nights/games/<name>/index.html) into one self-contained file
(dist/<name>.html, beside Retro Kit's games): the kit's stylesheet, script and fonts are copied into the page,
with the fonts' licences beside them, so the result plays offline, from any folder, with no other files.
A game's soundtrack is copied in too: a music.js beside its index.html, or a file in city-nights/music/ that more
than one page can share (Grunge City Rider's two tracks, which the test page plays too).

Run it from the Retro Games folder:
    python city-nights/kit/build.py               build every City Nights game
    python city-nights/kit/build.py my-game       build one game (its folder name)
    python city-nights/kit/build.py --characters  remake fonts/characters.txt after new fonts are copied in

Only tags marked with data-cn-inline are copied in, and only these files may be: the kit's stylesheet, the kit's
script, and a soundtrack file (a music.js beside the game's index.html, or a .js file in city-nights/music/). A
soundtrack file is the soundtrack as text and nothing else: a comment, then one line per track, two at most (a
City Nights game may have two, ARCADE.md):  window.MY_GAME_MUSIC = "<the MP3 in base64>";

It warns about anything the arcade's rules (ARCADE.md) or City Nights' rules forbid:
- colour codes in a game (hex, rgb(), hsl(), colour names such as 'red'): games use the kit's named colours
- network requests and internet addresses, in the game or the kit: games work offline
- image and audio files, and files that would not be copied in
- Chinese characters the kit's fonts do not hold (fonts/characters.txt lists the ones they do)
- things that would flash or repeat faster than 3 times a second, where the code shows it: fast endless
  animations, fast blink formulas and fast timers
- kit fonts that differ from the design system's copy, and a characters.txt made from older fonts

Standard library only; Python 3.8 or newer. --characters also needs Node.js, because the fonts are WOFF2 files,
which Python cannot unpack on its own.
"""
import base64
import hashlib
import json
import pathlib
import re
import shutil
import subprocess
import sys

KIT = pathlib.Path(__file__).resolve().parent
CN = KIT.parent
ROOT = CN.parent
GAMES = CN / "games"
DIST = ROOT / "dist"
FONTS = KIT / "fonts"
LICENCES = KIT / "licences"
CHARACTERS = FONTS / "characters.txt"
DESIGN_FONTS = CN / "design-system" / "fonts"
RETRO_KIT_GAMES = ROOT / "games"   # Retro Kit's games build into the same dist/ folder
KIT_FILES = [KIT / "city-nights.css", KIT / "city-nights.js"]
MUSIC_DIR = CN / "music"   # soundtrack files more than one page shares

LINK_RE = re.compile(r"<link\b[^>]*\bdata-cn-inline\b[^>]*>", re.IGNORECASE)
SCRIPT_RE = re.compile(r"<script\b[^>]*\bdata-cn-inline\b[^>]*>\s*</script>", re.IGNORECASE)
INLINE_RE = re.compile(r"<(?:link|script)\b[^>]*\bdata-cn-inline\b[^>]*>", re.IGNORECASE)
HREF_RE = re.compile(r'\bhref\s*=\s*"([^"]+)"', re.IGNORECASE)
SRC_RE = re.compile(r'\bsrc\s*=\s*"([^"]+)"', re.IGNORECASE)
FONT_RE = re.compile(r'url\(\s*"?([^")]+\.woff2)"?\s*\)')
# a soundtrack file: comments, then one line per track (two at most) that stores the MP3 (as base64 text) on window
MUSIC_RE = re.compile(r'\s*(?:/\*.*?\*/\s*)*(?:window\.[A-Za-z_$][\w$]*\s*=\s*"[A-Za-z0-9+/]+={0,2}"\s*;?\s*){1,2}', re.DOTALL)
MUSIC_OPTION_RE = re.compile(r"\bmusic\s*:")

# Chinese: CJK ideographs, CJK punctuation and full-width forms. The two Chinese fonts hold only the word list's characters.
CHINESE_RE = re.compile("[⺀-〿㐀-䶿一-鿿豈-﫿︰-﹏＀-￯\U00020000-\U0003ffff]")
IDEOGRAPH_RE = re.compile("[㐀-䶿一-鿿豈-﫿\U00020000-\U0003ffff]")

# CSS's own colour names. 'transparent' and 'currentColor' are not colour codes, so they are allowed.
COLOUR_NAMES = (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood "
    "cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray "
    "darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen "
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue "
    "firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew "
    "hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan "
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray "
    "lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue "
    "mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred "
    "midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid "
    "palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple "
    "rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue "
    "slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white "
    "whitesmoke yellow yellowgreen"
).split()
NAMES = "|".join(COLOUR_NAMES)
COLOUR_PROPS = (r"(?:color|background(?:-color)?|fill|stroke|border(?:-(?:top|right|bottom|left))?(?:-color)?|"
                r"outline(?:-color)?|text-shadow|box-shadow|caret-color|accent-color|column-rule(?:-color)?|"
                r"text-decoration(?:-color)?|stop-color|flood-color|lighting-color)")

COLOUR_WHY = "a colour code: games name the kit's colours instead (city-nights/design-system/tokens.json)"

# Checked in a game's index.html only: the kit itself defines the colours.
GAME_CHECKS = [
    (re.compile(r"(?<![&\w])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b"), COLOUR_WHY),
    (re.compile(r"\b(?:rgba?|hsla?|hwb|oklab|oklch)\s*\(", re.IGNORECASE), COLOUR_WHY),
    (re.compile(r"([\"'])(?:" + NAMES + r")\1", re.IGNORECASE), COLOUR_WHY),
    # a colour name as a CSS value (color: white), but not inside a token name (var(--ink-white)) or a property (g.white)
    (re.compile(r"(?:^|[\s;{\"'])" + COLOUR_PROPS + r"\s*:[^;{}]*(?<![\w.-])(?:" + NAMES + r")(?![\w-])", re.IGNORECASE), COLOUR_WHY),
    (re.compile(r"<(?:img|picture|image|video|audio)\b|\bnew\s+(?:Image|Audio)\s*\(", re.IGNORECASE),
     "an image, video or audio file: City Nights draws everything in code, and sounds come from the kit (a soundtrack goes in music.js)"),
    (re.compile(r"[\"'(]\s*[^\"'()\s]*\.(?:png|jpe?g|gif|webp|avif|bmp|ico|svg|mp3|wav|ogg|m4a|mp4|webm)\s*[\"')]", re.IGNORECASE),
     "a picture, sound or video file: City Nights draws everything in code, and sounds come from the kit (a soundtrack goes in music.js)"),
    (re.compile(r"data:image/(?!svg)", re.IGNORECASE), "a picture stored as data: City Nights draws everything in code"),
    (re.compile(r"<script\b(?![^>]*data-cn-inline)[^>]*\bsrc\s*=|<link\b(?![^>]*data-cn-inline)[^>]*\bhref\s*=|"
                r"<(?:iframe|object|embed)\b|@import\b|url\(\s*[\"']?(?![\"']?(?:data:|#))", re.IGNORECASE),
     "an extra file: keep the game's code in index.html (a soundtrack, music.js, is the one exception: mark its tag data-cn-inline)"),
]

# Checked in the game and in the kit's own files: nothing in the built page may reach the internet.
NETWORK_CHECKS = [
    (re.compile(r"\b(?:https?|wss?|ftp)://(?!www\.w3\.org/)", re.IGNORECASE), "an internet address: games must work offline"),
    (re.compile(r"\b(?:src|href|action)\s*=\s*[\"']//", re.IGNORECASE), "an internet address: games must work offline"),
    (re.compile(r"\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|\bsendBeacon\b|\bimportScripts\s*\(|"
                r"\bimport\s*\(|\bnew\s+(?:Shared)?Worker\s*\(|\bserviceWorker\b|\bRTCPeerConnection\b|<form\b"),
     "a network request: games must work offline, with nothing fetched or sent"),
]

# Checked in the game and in the kit's own files: the arcade's flash limit, where the code shows the rate.
FAST = 1 / 3   # seconds: anything repeating quicker than this flashes more than 3 times a second
FLASH_WHY = "nothing bigger than a character may flash more than 3 times a second (a player's respawn blink may reach 6)"
TIME_RE = re.compile(r"(?<![\w.-])(\d*\.?\d+)(ms|s)\b")
BLINK_RE = re.compile(r"Math\.floor\(\s*[^()]*?\*\s*(\d+(?:\.\d+)?)\s*\)\s*%\s*2\b")
INTERVAL_RE = re.compile(r"\bsetInterval\s*\([^;]*,\s*(\d+(?:\.\d+)?)\s*\)")
WAAPI_RE = re.compile(r"\biterations\s*:\s*Infinity\b.*?\bduration\s*:\s*(\d+(?:\.\d+)?)|"
                      r"\bduration\s*:\s*(\d+(?:\.\d+)?).*?\biterations\s*:\s*Infinity\b")


def fail(message):
    print("Build failed: " + message)
    sys.exit(1)


def read_text(path):
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        fail("cannot find " + str(path))


def rel(path):
    """A path as Barney sees it, from the Retro Games folder."""
    try:
        return path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return str(path)


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def licence_for(font):
    """Each font's licence is named after the start of its file name: Antonio-Variable.woff2 -> Antonio-OFL.txt."""
    return LICENCES / (font.name.split("-")[0] + "-OFL.txt")


def licence_note(fonts):
    """The fonts' licences, as a comment to sit beside the embedded fonts (every built game carries them)."""
    names = sorted({licence_for(f).name for f in fonts})
    parts = ["/* The fonts embedded below (" + ", ".join(f.name for f in fonts) + ") are each under the SIL Open "
             "Font License 1.1.\n   The two Noto fonts are cut down to City Nights' word list. The licences follow in full.\n"]
    for name in names:
        text = (LICENCES / name).read_text(encoding="utf-8").replace("\r\n", "\n").strip()
        if "*/" in text:
            fail("licences/" + name + " contains */, which would end the comment that carries it")
        parts.append("\n   ---- " + name + " ----\n\n" + text + "\n")
    return "".join(parts) + "*/\n"


def inline_css(css_path):
    css = read_text(css_path)
    fonts = []

    def embed(match):
        font = (css_path.parent / match.group(1)).resolve()
        if not font.exists():
            fail("font file missing: " + rel(font))
        if not licence_for(font).exists():
            fail(font.name + " has no licence: put its licence in " + rel(licence_for(font)))
        if font not in fonts:
            fonts.append(font)
        data = base64.b64encode(font.read_bytes()).decode("ascii")
        return 'url("data:font/woff2;base64,' + data + '")'

    css = FONT_RE.sub(embed, css)
    if fonts:
        css = licence_note(fonts) + css
    return css.replace("</style", "<\\/style")


def inline_js(js_path):
    js = read_text(js_path)
    return js.replace("</script", "<\\/script")


def load_characters():
    """The Chinese characters the kit's fonts hold, from fonts/characters.txt, and the fonts it was made from."""
    if not CHARACTERS.exists():
        return None, {}
    chars, made_from = set(), {}
    for line in CHARACTERS.read_text(encoding="utf-8").splitlines():
        if line.startswith("#"):
            m = re.match(r"#\s+(\S+\.woff2)\s+sha256\s+([0-9a-f]{64})", line)
            if m:
                made_from[m.group(1)] = m.group(2)
        else:
            chars.update(c for c in line if not c.isspace())
    return chars, made_from


def check_kit():
    """Warn about the kit's own fonts: a copy that differs from the design system's, or a characters.txt that
    was made from other fonts. Returns the number of warnings."""
    notes = []
    if DESIGN_FONTS.is_dir():
        spec = {p.name: p for p in DESIGN_FONTS.glob("*.woff2")}
        kit = {p.name: p for p in FONTS.glob("*.woff2")}
        for name in sorted(set(spec) | set(kit)):
            if name not in kit:
                notes.append("the design system has " + name + ", which city-nights/kit/fonts/ lacks: copy it in")
            elif name not in spec:
                notes.append("city-nights/kit/fonts/" + name + " is not in the design system's fonts: the design system is the spec")
            elif sha256(spec[name]) != sha256(kit[name]):
                notes.append("city-nights/kit/fonts/" + name + " differs from the design system's copy: copy the design system's in")
    chars, made_from = load_characters()
    if chars is None:
        notes.append("city-nights/kit/fonts/characters.txt is missing, so Chinese characters cannot be checked: "
                     "run  python city-nights/kit/build.py --characters")
    else:
        for name, digest in sorted(made_from.items()):
            font = FONTS / name
            if not font.exists() or sha256(font) != digest:
                notes.append("city-nights/kit/fonts/characters.txt was made from an older " + name +
                             ": run  python city-nights/kit/build.py --characters")
    for note in notes:
        print("  Warning: " + note + ".")
    return len(notes)


def fast_animations(text):
    """Line numbers of CSS rules that run an endless animation quicker than 3 times a second."""
    found = []
    for block in re.finditer(r"\{[^{}]*\}", text):
        body = block.group(0)
        if "infinite" not in body:
            continue
        for decl in re.finditer(r"animation(?:-duration)?\s*:([^;}]*)", body):
            times = [float(n) * (0.001 if unit == "ms" else 1) for n, unit in TIME_RE.findall(decl.group(1))]
            if times and 0 < times[0] < FAST:
                found.append(text.count("\n", 0, block.start() + decl.start()) + 1)
    return found


def check_lines(label, text, chars, game):
    """Warn about one file going into the built page. game=True adds the checks that apply to games only.
    Returns the number of warnings."""
    count = 0
    unknown = {}

    def warn(number, why):
        nonlocal count
        print("  Warning: " + label + " line " + str(number) + " has " + why + ".")
        count += 1

    for number, line in enumerate(text.splitlines(), start=1):
        whys = []
        for pattern, why in (GAME_CHECKS if game else []) + NETWORK_CHECKS:
            if pattern.search(line) and why not in whys:
                whys.append(why)
        for why in whys:
            warn(number, why)
        for m in BLINK_RE.finditer(line):
            if float(m.group(1)) / 2 > 3:
                warn(number, "a blink that flashes " + ("%g" % (float(m.group(1)) / 2)) +
                     " times a second if its time is in seconds: " + FLASH_WHY)
        for m in INTERVAL_RE.finditer(line):
            if 0 < float(m.group(1)) < FAST * 1000:
                warn(number, "a timer that repeats every " + m.group(1) + " ms, too fast for anything it switches on and off: " + FLASH_WHY)
        for m in WAAPI_RE.finditer(line):
            ms = float(m.group(1) or m.group(2))
            if 0 < ms < FAST * 1000:
                warn(number, "an endless " + ("%g" % ms) + " ms animation, repeating more than 3 times a second: " + FLASH_WHY)
        if chars is not None:
            for c in CHINESE_RE.findall(line):
                if c not in chars and c not in unknown:
                    unknown[c] = number
    for number in fast_animations(text):
        warn(number, "an endless animation, repeating more than 3 times a second: " + FLASH_WHY)
    for c, number in sorted(unknown.items(), key=lambda kv: kv[1]):
        warn(number, c + " (U+%04X), which the kit's Chinese fonts do not hold: a new word goes on the design system's "
             "word list first and the fonts are cut again (city-nights/HANDOVER.md, Other)" % ord(c))
    return count


def check_inlined(game_dir, html):
    """Warn about copied-in files other than the kit and the soundtrack, and about a soundtrack that is
    not set up the allowed way. Returns the number of warnings."""
    music = (game_dir / "music.js").resolve()
    shared = MUSIC_DIR.resolve()
    kit = [f.resolve() for f in KIT_FILES]
    notes = []
    tracks = []   # the soundtrack files it copies in
    for tag in INLINE_RE.findall(html):
        ref = SRC_RE.search(tag) or HREF_RE.search(tag)
        if not ref:
            continue
        target = (game_dir / ref.group(1)).resolve()
        if target == music or (target.parent == shared and target.suffix == ".js"):
            tracks.append((ref.group(1), target))
        elif target not in kit:
            notes.append("index.html copies in " + ref.group(1) + ": only the kit's two files and a soundtrack file (music.js beside index.html, or one in city-nights/music/) may be data-cn-inline")
    for name, target in tracks:
        if not target.exists():
            notes.append("index.html copies in " + name + ", which is not there")
        elif not MUSIC_RE.fullmatch(read_text(target)):
            notes.append(name + ' must hold only the soundtrack as text: a line (two at most) of the form window.MY_GAME_MUSIC = "<the MP3 in base64>"')
    if tracks and not MUSIC_OPTION_RE.search(html):
        notes.append("index.html copies in a soundtrack but never plays it: add music: { data: window.MY_GAME_MUSIC } to CityNights.game")
    if not any(target == music for name, target in tracks) and music.exists():
        notes.append('music.js is not copied in: add <script src="music.js" data-cn-inline></script> to the head of index.html')
    for p in sorted(game_dir.iterdir()):
        if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".bmp", ".ico", ".svg"):
            notes.append(p.name + " is a picture file: City Nights draws everything in code")
    for note in notes:
        print("  Warning: " + game_dir.name + "/" + note + ".")
    return len(notes)


def build(game_dir, chars):
    """Build one game into dist/. Returns the number of warnings."""
    source = game_dir / "index.html"
    if not source.exists():
        fail(game_dir.name + " has no index.html")
    if (RETRO_KIT_GAMES / game_dir.name / "index.html").exists():
        fail("games/" + game_dir.name + " is a Retro Kit game with the same name, and both would build to dist/" +
             game_dir.name + ".html: give the City Nights game another folder name")
    html = read_text(source)
    warnings = check_lines(game_dir.name + "/index.html", html, chars, game=True)
    warnings += check_inlined(game_dir, html)
    if not SCRIPT_RE.search(html) or not LINK_RE.search(html):
        fail(game_dir.name + "/index.html must link city-nights.css and city-nights.js with data-cn-inline (see city-nights/kit/template.html)")

    def swap_link(match):
        href = HREF_RE.search(match.group(0))
        if not href:
            fail("a data-cn-inline <link> has no href")
        return "<style>\n" + inline_css((game_dir / href.group(1)).resolve()) + "\n</style>"

    def swap_script(match):
        src = SRC_RE.search(match.group(0))
        if not src:
            fail("a data-cn-inline <script> has no src")
        return "<script>\n" + inline_js((game_dir / src.group(1)).resolve()) + "\n</script>"

    html = LINK_RE.sub(swap_link, html)
    html = SCRIPT_RE.sub(swap_script, html)
    DIST.mkdir(exist_ok=True)
    out = DIST / (game_dir.name + ".html")
    out.write_text(html, encoding="utf-8", newline="\n")
    size = out.stat().st_size / 1024
    print("  Built dist/" + out.name + " (" + str(round(size)) + " KB)")
    return warnings


# Reads each WOFF2 font named on the command line and prints {file name: [the characters it holds]} as JSON.
# Node.js can unpack WOFF2 (Brotli) and Python's standard library cannot, so --characters hands this part to Node.
CMAP_JS = r"""
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const TAGS = ['cmap','head','hhea','hmtx','maxp','name','OS/2','post','cvt ','fpgm','glyf','loca','prep','CFF ','VORG','EBDT','EBLC','gasp','hdmx','kern','LTSH','PCLT','VDMX','vhea','vmtx','BASE','GDEF','GPOS','GSUB','EBSC','JSTF','MATH','CBDT','CBLC','COLR','CPAL','SVG ','sbix','acnt','avar','bdat','bloc','bsln','cvar','fdsc','feat','fmtx','fvar','gvar','hsty','just','lcar','mort','morx','opbd','prop','trak','Zapf','Silf','Glat','Gloc','Feat','Sill'];
const out = {};
for (const file of process.argv.slice(1)) {
  const buf = fs.readFileSync(file);
  if (buf.toString('latin1', 0, 4) !== 'wOF2') throw new Error(file + ' is not a WOFF2 font');
  let p = 12;
  const numTables = buf.readUInt16BE(p); p = 20;
  const compressed = buf.readUInt32BE(p); p = 48;
  const base128 = () => { let v = 0; for (let i = 0; i < 5; i++) { const b = buf[p++]; v = v * 128 + (b & 127); if (!(b & 128)) return v; } throw new Error('bad WOFF2 table directory'); };
  const tables = []; let off = 0;
  for (let i = 0; i < numTables; i++) {
    const flags = buf[p++]; let tag = TAGS[flags & 63];
    if ((flags & 63) === 63) { tag = buf.toString('latin1', p, p + 4); p += 4; }
    const xf = flags >> 6; let len = base128();
    if ((tag === 'glyf' || tag === 'loca') ? xf === 0 : xf !== 0) len = base128();
    tables.push({ tag, off, len }); off += len;
  }
  const data = zlib.brotliDecompressSync(buf.subarray(p, p + compressed));
  const t = tables.find(x => x.tag === 'cmap'), c = data.subarray(t.off, t.off + t.len), chars = new Set();
  for (let i = 0, n = c.readUInt16BE(2); i < n; i++) {
    const so = c.readUInt32BE(8 + i * 8), fmt = c.readUInt16BE(so);
    if (fmt === 4) {
      const seg2 = c.readUInt16BE(so + 6), ends = so + 14, starts = ends + seg2 + 2, deltas = starts + seg2, ranges = deltas + seg2;
      for (let s = 0; s < seg2 / 2; s++) {
        const end = c.readUInt16BE(ends + s * 2), start = c.readUInt16BE(starts + s * 2), delta = c.readInt16BE(deltas + s * 2), ro = c.readUInt16BE(ranges + s * 2);
        for (let ch = start; ch <= end && ch !== 0xffff; ch++) {
          let g = ro === 0 ? (ch + delta) & 0xffff : c.readUInt16BE(ranges + s * 2 + ro + (ch - start) * 2);
          if (ro !== 0 && g) g = (g + delta) & 0xffff;
          if (g) chars.add(ch);
        }
      }
    } else if (fmt === 12) {
      for (let k = 0, ng = c.readUInt32BE(so + 12); k < ng; k++) {
        const a = c.readUInt32BE(so + 16 + k * 12), b = c.readUInt32BE(so + 20 + k * 12), g = c.readUInt32BE(so + 24 + k * 12);
        for (let ch = a; ch <= b; ch++) if (g + ch - a) chars.add(ch);
      }
    }
  }
  out[path.basename(file)] = [...chars].sort((a, b) => a - b);
}
process.stdout.write(JSON.stringify(out));
"""


def make_characters():
    """Remake fonts/characters.txt from the fonts themselves: the Chinese characters every Chinese font holds."""
    node = shutil.which("node")
    if not node:
        fail("--characters needs Node.js (the command node), which reads the WOFF2 fonts")
    fonts = sorted(FONTS.glob("*.woff2"))
    run = subprocess.run([node, "-e", CMAP_JS] + [str(f) for f in fonts], capture_output=True, text=True)
    if run.returncode != 0:
        fail("Node.js could not read the fonts: " + (run.stderr.strip().splitlines() or ["no reason given"])[-1])
    held = {name: {chr(c) for c in codes} for name, codes in json.loads(run.stdout).items()}
    chinese = {name: {c for c in chars if IDEOGRAPH_RE.match(c)} for name, chars in held.items()}
    chinese = {name: chars for name, chars in chinese.items() if chars}
    if not chinese:
        fail("no font in city-nights/kit/fonts/ holds Chinese characters")
    common = set.intersection(*chinese.values())
    lines = [
        "# The Chinese characters that City Nights' Chinese fonts hold: the characters on the design system's word list.",
        "# build.py warns about any Chinese character in a game or the kit that is not here. Made by build.py from the",
        "# fonts themselves; after new fonts are copied in, run:  python city-nights/kit/build.py --characters",
        "# Made from:",
    ]
    lines += ["#   " + name + " sha256 " + sha256(FONTS / name) for name in sorted(chinese)]
    for name, chars in sorted(chinese.items()):
        if chars != common:
            lines.append("# " + name + " also holds " + "".join(sorted(chars - common)) + ", left out because the other Chinese font lacks it.")
    ordered = "".join(sorted(common))
    lines += [ordered[i:i + 40] for i in range(0, len(ordered), 40)]
    CHARACTERS.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print("Wrote " + rel(CHARACTERS) + ": " + str(len(common)) + " characters, held by " + " and ".join(sorted(chinese)) + ".")


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="backslashreplace")   # a Windows console that cannot show Chinese gets \u codes, not a crash
    args = sys.argv[1:]
    if args == ["--characters"]:
        make_characters()
        return
    if args:
        dirs = [GAMES / n for n in args]
        for d in dirs:
            if not d.is_dir():
                fail("no game folder called city-nights/games/" + d.name)
    else:
        dirs = sorted(p for p in GAMES.iterdir() if p.is_dir() and (p / "index.html").exists()) if GAMES.exists() else []
        if not dirs:
            fail("no games found in city-nights/games/")
    warnings = check_kit()
    chars, _ = load_characters()
    for f in KIT_FILES:
        if f.exists():
            warnings += check_lines(rel(f), read_text(f), chars, game=False)
    for d in dirs:
        warnings += build(d, chars)
    if warnings:
        print("Done, with " + str(warnings) + " warning" + ("s" if warnings > 1 else "") + ": a game is finished only when it builds with none.")
    else:
        print("Done, no warnings. Open the file in dist/ to play.")


if __name__ == "__main__":
    main()
