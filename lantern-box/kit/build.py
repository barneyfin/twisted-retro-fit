#!/usr/bin/env python3
"""Lantern Box build. Copied from Retro Kit's build (kit/build.py) and adapted; the fuller rule checks, the licences
beside the fonts and the font check come from City Nights' copy of it (city-nights/kit/build.py).

Turns each Lantern Box game's source (lantern-box/games/<name>/index.html) into one self-contained file
(dist/<name>.html, beside the other kits' games): the kit's stylesheet, script and fonts are copied into the page,
with the fonts' licences beside them, so the result plays offline, from any folder, with no other files.
A game's soundtrack (a music.js beside its index.html) is copied in too.

Run it from the Retro Games folder:
    python lantern-box/kit/build.py               build every Lantern Box game
    python lantern-box/kit/build.py my-game       build one game (its folder name)

Only tags marked with data-lb-inline are copied in, and only these files may be: the kit's stylesheet, the kit's
script, and a music.js beside the game's index.html. music.js is the soundtrack as text and nothing else: a comment,
then one line per track, two at most (a Lantern Box game may have two, ARCADE.md):
    window.MY_GAME_MUSIC = "<the MP3 in base64>";

It warns about anything the arcade's rules (ARCADE.md) or Lantern Box's rules forbid:
- colour codes in a game (hex, rgb(), hsl(), colour names such as 'red'): games use the kit's named colours
- network requests and internet addresses, in the game or the kit: games work offline
- image, video and audio files, and files that would not be copied in
- text drawn on the canvas in a game (the Interface is HTML), and a game's own audio code
- things that would flash or repeat faster than 3 times a second, where the code shows it: fast endless
  animations, fast blink formulas and fast timers
- kit fonts that differ from the design system's copy
- the kit's recorded sounds (SND_CLIPS) coming to 100 KB or more, or without their source and licence noted in
  lantern-box/kit/licences/README.md (ARCADE.md)

Standard library only; Python 3.8 or newer.
"""
import base64
import hashlib
import pathlib
import re
import sys

KIT = pathlib.Path(__file__).resolve().parent
LB = KIT.parent
ROOT = LB.parent
GAMES = LB / "games"
DIST = ROOT / "dist"
FONTS = KIT / "fonts"
LICENCES = KIT / "licences"
DESIGN_FONTS = LB / "design-system" / "fonts"
OTHER_GAMES = [ROOT / "games", ROOT / "city-nights" / "games"]   # the other kits' games build into the same dist/ folder
KIT_FILES = [KIT / "lantern-box.css", KIT / "lantern-box.js"]

LINK_RE = re.compile(r"<link\b[^>]*\bdata-lb-inline\b[^>]*>", re.IGNORECASE)
SCRIPT_RE = re.compile(r"<script\b[^>]*\bdata-lb-inline\b[^>]*>\s*</script>", re.IGNORECASE)
INLINE_RE = re.compile(r"<(?:link|script)\b[^>]*\bdata-lb-inline\b[^>]*>", re.IGNORECASE)
HREF_RE = re.compile(r'\bhref\s*=\s*"([^"]+)"', re.IGNORECASE)
SRC_RE = re.compile(r'\bsrc\s*=\s*"([^"]+)"', re.IGNORECASE)
FONT_RE = re.compile(r'url\(\s*"?([^")]+\.woff2)"?\s*\)')
# music.js: comments, then one line per track (two at most) that stores the MP3 (as base64 text) on window
MUSIC_RE = re.compile(r'\s*(?:/\*.*?\*/\s*)*(?:window\.[A-Za-z_$][\w$]*\s*=\s*"[A-Za-z0-9+/]+={0,2}"\s*;?\s*){1,2}', re.DOTALL)
MUSIC_OPTION_RE = re.compile(r"\bmusic\s*:")

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

COLOUR_WHY = "a colour code: games name the kit's colours instead (lantern-box/design-system/tokens.json)"

# Checked in a game's index.html only: the kit itself defines the colours and draws the sketches it needs.
GAME_CHECKS = [
    (re.compile(r"(?<![&\w])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b"), COLOUR_WHY),
    (re.compile(r"\b(?:rgba?|hsla?|hwb|oklab|oklch)\s*\(", re.IGNORECASE), COLOUR_WHY),
    (re.compile(r"([\"'])(?:" + NAMES + r")\1", re.IGNORECASE), COLOUR_WHY),
    # a colour name as a CSS value (color: white), but not inside a token name (var(--text-white)) or a property (g.white)
    (re.compile(r"(?:^|[\s;{\"'])" + COLOUR_PROPS + r"\s*:[^;{}]*(?<![\w.-])(?:" + NAMES + r")(?![\w-])", re.IGNORECASE), COLOUR_WHY),
    (re.compile(r"\b(?:fillText|strokeText)\s*\("),
     "text drawn on the canvas: everything a player reads is HTML, and hits, defeats and wisps are drawn in the World"),
    (re.compile(r"<(?:img|picture|image|video|audio)\b|\bnew\s+(?:Image|Audio)\s*\(", re.IGNORECASE),
     "an image, video or audio file: Lantern Box draws everything in code, and sounds come from the kit (a soundtrack goes in music.js)"),
    (re.compile(r"[\"'(]\s*[^\"'()\s]*\.(?:png|jpe?g|gif|webp|avif|bmp|ico|svg|mp3|wav|ogg|m4a|mp4|webm)\s*[\"')]", re.IGNORECASE),
     "a picture, sound or video file: Lantern Box draws everything in code, and sounds come from the kit (a soundtrack goes in music.js)"),
    (re.compile(r"data:image/(?!svg)", re.IGNORECASE), "a picture stored as data: Lantern Box draws everything in code"),
    (re.compile(r"\b(?:AudioContext|decodeAudioData|createBufferSource)\b"),
     "its own audio code: sounds come from the kit, and a soundtrack from the kit's music option"),
    (re.compile(r"<script\b(?![^>]*data-lb-inline)[^>]*\bsrc\s*=|<link\b(?![^>]*data-lb-inline)[^>]*\bhref\s*=|"
                r"<(?:iframe|object|embed)\b|@import\b|url\(\s*[\"']?(?![\"']?(?:data:|#))", re.IGNORECASE),
     "an extra file: keep the game's code in index.html (a soundtrack, music.js, is the one exception: mark its tag data-lb-inline)"),
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
    """Each font's licence is named after the start of its file name: AlegreyaSans-Bold.woff2 -> AlegreyaSans-OFL.txt."""
    return LICENCES / (font.name.split("-")[0] + "-OFL.txt")


def licence_note(fonts):
    """The fonts' licences, as a comment to sit beside the embedded fonts (every built game carries them)."""
    names = sorted({licence_for(f).name for f in fonts})
    parts = ["/* The fonts embedded below (" + ", ".join(f.name for f in fonts) + ") are each under the SIL Open "
             "Font License 1.1.\n   The licences follow in full.\n"]
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


CLIPS_RE = re.compile(r"const SND_CLIPS\s*=\s*\{(.*?)\};", re.DOTALL)
CLIP_RE = re.compile(r'"([\w-]+)"\s*:\s*"([A-Za-z0-9+/]*={0,2})"')
CLIPS_LIMIT = 100 * 1024   # bytes: ARCADE.md allows short sound effects under 100 KB in all


def check_clips():
    """Warn about the kit's recorded sounds: 100 KB or more in all, or no note of their source and licence. Returns the number of warnings."""
    notes = []
    m = CLIPS_RE.search(read_text(KIT / "lantern-box.js"))
    if m:
        size = sum(len(base64.b64decode(data)) for _, data in CLIP_RE.findall(m.group(1)))
        if size >= CLIPS_LIMIT:
            notes.append("the kit's recorded sounds (SND_CLIPS in lantern-box.js) come to " + str(round(size / 1024)) +
                         " KB: ARCADE.md allows short sound effects under 100 KB in all")
        readme = LICENCES / "README.md"
        if not readme.exists() or "Pixabay" not in readme.read_text(encoding="utf-8"):
            notes.append("the kit's recorded sounds have no note of their source and licence in lantern-box/kit/licences/README.md (ARCADE.md)")
    for note in notes:
        print("  Warning: " + note + ".")
    return len(notes)


def check_kit():
    """Warn about the kit's own fonts: a copy that differs from the design system's. Returns the number of warnings."""
    notes = []
    if DESIGN_FONTS.is_dir():
        spec = {p.name: p for p in DESIGN_FONTS.glob("*.woff2")}
        kit = {p.name: p for p in FONTS.glob("*.woff2")}
        for name in sorted(set(spec) | set(kit)):
            if name not in kit:
                notes.append("the design system has " + name + ", which lantern-box/kit/fonts/ lacks: copy it in")
            elif name not in spec:
                notes.append("lantern-box/kit/fonts/" + name + " is not in the design system's fonts: the design system is the spec")
            elif sha256(spec[name]) != sha256(kit[name]):
                notes.append("lantern-box/kit/fonts/" + name + " differs from the design system's copy: copy the design system's in")
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


def check_lines(label, text, game):
    """Warn about one file going into the built page. game=True adds the checks that apply to games only.
    Returns the number of warnings."""
    count = 0

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
    for number in fast_animations(text):
        warn(number, "an endless animation, repeating more than 3 times a second: " + FLASH_WHY)
    return count


def check_inlined(game_dir, html):
    """Warn about copied-in files other than the kit and the soundtrack, about a soundtrack that is not set up the
    allowed way, and about picture files in the game's folder. Returns the number of warnings."""
    music = (game_dir / "music.js").resolve()
    kit = [f.resolve() for f in KIT_FILES]
    notes = []
    has_music = False
    for tag in INLINE_RE.findall(html):
        ref = SRC_RE.search(tag) or HREF_RE.search(tag)
        if not ref:
            continue
        target = (game_dir / ref.group(1)).resolve()
        if target == music:
            has_music = True
        elif target not in kit:
            notes.append("index.html copies in " + ref.group(1) + ": only the kit's two files and a music.js beside index.html may be data-lb-inline")
    if has_music:
        if not music.exists():
            notes.append("index.html copies in music.js, which is not there")
        elif not MUSIC_RE.fullmatch(read_text(music)):
            notes.append('music.js must hold only the soundtrack as text: a line (two at most) of the form window.MY_GAME_MUSIC = "<the MP3 in base64>"')
        if not MUSIC_OPTION_RE.search(html):
            notes.append("index.html copies in a soundtrack but never plays it: add music: { data: window.MY_GAME_MUSIC } to LanternBox.game")
    elif music.exists():
        notes.append('music.js is not copied in: add <script src="music.js" data-lb-inline></script> to the head of index.html')
    for p in sorted(game_dir.iterdir()):
        if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".bmp", ".ico", ".svg"):
            notes.append(p.name + " is a picture file: Lantern Box draws everything in code")
    for note in notes:
        print("  Warning: " + game_dir.name + "/" + note + ".")
    return len(notes)


def build(game_dir):
    """Build one game into dist/. Returns the number of warnings."""
    source = game_dir / "index.html"
    if not source.exists():
        fail(game_dir.name + " has no index.html")
    for other in OTHER_GAMES:
        if (other / game_dir.name / "index.html").exists():
            fail(rel(other / game_dir.name) + " is another kit's game with the same name, and both would build to dist/" +
                 game_dir.name + ".html: give the Lantern Box game another folder name")
    html = read_text(source)
    warnings = check_lines(game_dir.name + "/index.html", html, game=True)
    warnings += check_inlined(game_dir, html)
    if not SCRIPT_RE.search(html) or not LINK_RE.search(html):
        fail(game_dir.name + "/index.html must link lantern-box.css and lantern-box.js with data-lb-inline (see lantern-box/kit/template.html)")

    def swap_link(match):
        href = HREF_RE.search(match.group(0))
        if not href:
            fail("a data-lb-inline <link> has no href")
        return "<style>\n" + inline_css((game_dir / href.group(1)).resolve()) + "\n</style>"

    def swap_script(match):
        src = SRC_RE.search(match.group(0))
        if not src:
            fail("a data-lb-inline <script> has no src")
        return "<script>\n" + inline_js((game_dir / src.group(1)).resolve()) + "\n</script>"

    html = LINK_RE.sub(swap_link, html)
    html = SCRIPT_RE.sub(swap_script, html)
    DIST.mkdir(exist_ok=True)
    out = DIST / (game_dir.name + ".html")
    out.write_text(html, encoding="utf-8", newline="\n")
    size = out.stat().st_size / 1024
    print("  Built dist/" + out.name + " (" + str(round(size)) + " KB)")
    return warnings


def main():
    args = sys.argv[1:]
    if args:
        dirs = [GAMES / n for n in args]
        for d in dirs:
            if not d.is_dir():
                fail("no game folder called lantern-box/games/" + d.name)
    else:
        dirs = sorted(p for p in GAMES.iterdir() if p.is_dir() and (p / "index.html").exists()) if GAMES.exists() else []
        if not dirs:
            fail("no games found in lantern-box/games/")
    warnings = check_kit() + check_clips()
    for f in KIT_FILES:
        if f.exists():
            warnings += check_lines(rel(f), read_text(f), game=False)
    for d in dirs:
        warnings += build(d)
    if warnings:
        print("Done, with " + str(warnings) + " warning" + ("s" if warnings > 1 else "") + ": a game is finished only when it builds with none.")
    else:
        print("Done, no warnings. Open the file in dist/ to play.")


if __name__ == "__main__":
    main()
