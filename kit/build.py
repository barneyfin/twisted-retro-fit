#!/usr/bin/env python3
"""Retro Kit build.

Turns each game's source (games/<name>/index.html) into one self-contained file (dist/<name>.html):
the kit's stylesheet, script and fonts are copied into the page, so the result plays offline,
from any folder, with no other files. A game's soundtrack (games/<name>/music.js) is copied in too.

Run it from the Retro Games folder:
    python kit/build.py               build every game
    python kit/build.py my-game       build one game (its folder name)

Only tags marked with data-rk-inline are copied in, and only three files may be: the kit's stylesheet,
the kit's script, and a music.js beside the game's index.html. music.js is the soundtrack as text and
nothing else, one line:  window.MY_GAME_MUSIC = "<the MP3 in base64>";  The game hands that to the kit
with the music option (music: { data: window.MY_GAME_MUSIC }) and the kit plays it.

It also warns about anything the Retro Kit rules forbid in a game (hex colours, canvas text, image or
audio files, its own audio code, internet addresses, extra files).
Standard library only; Python 3.8 or newer.
"""
import base64
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
KIT = ROOT / "kit"
GAMES = ROOT / "games"
DIST = ROOT / "dist"

LINK_RE = re.compile(r"<link\b[^>]*\bdata-rk-inline\b[^>]*>", re.IGNORECASE)
SCRIPT_RE = re.compile(r"<script\b[^>]*\bdata-rk-inline\b[^>]*>\s*</script>", re.IGNORECASE)
INLINE_RE = re.compile(r"<(?:link|script)\b[^>]*\bdata-rk-inline\b[^>]*>", re.IGNORECASE)
HREF_RE = re.compile(r'\bhref\s*=\s*"([^"]+)"', re.IGNORECASE)
SRC_RE = re.compile(r'\bsrc\s*=\s*"([^"]+)"', re.IGNORECASE)
FONT_RE = re.compile(r'url\(\s*"?([^")]+\.woff2)"?\s*\)')
# music.js: comments, then one line that stores the MP3 (as base64 text) on window. Nothing else.
MUSIC_RE = re.compile(r'\s*(?:/\*.*?\*/\s*)*window\.[A-Za-z_$][\w$]*\s*=\s*"[A-Za-z0-9+/]+={0,2}"\s*;?\s*', re.DOTALL)
MUSIC_OPTION_RE = re.compile(r"\bmusic\s*:")


def fail(message):
    print("Build failed: " + message)
    sys.exit(1)


def read_text(path):
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        fail("cannot find " + str(path))


def inline_css(css_path):
    css = read_text(css_path)

    def embed(match):
        font = (css_path.parent / match.group(1)).resolve()
        if not font.exists():
            fail("font file missing: " + str(font))
        data = base64.b64encode(font.read_bytes()).decode("ascii")
        return 'url("data:font/woff2;base64,' + data + '")'

    css = FONT_RE.sub(embed, css)
    return css.replace("</style", "<\\/style")


def inline_js(js_path):
    js = read_text(js_path)
    return js.replace("</script", "<\\/script")


CHECKS = [
    (re.compile(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b"), "a hex colour: use a token name such as 'aqua' or 'chrome-300'"),
    (re.compile(r"\b(fillText|strokeText)\s*\("), "text drawn on the canvas: use rk.popup() or rk.banner()"),
    (re.compile(r"<img\b|<audio\b|<video\b|new\s+Audio\s*\(", re.IGNORECASE), "an image or audio file: use sprites and rk.sfx() (a soundtrack goes in music.js, played by the kit's music option)"),
    (re.compile(r"AudioContext|decodeAudioData|createBufferSource"), "its own audio code: use rk.sfx(), and the kit's music option for a soundtrack"),
    (re.compile(r"https?://", re.IGNORECASE), "an internet address: games must work offline"),
    (re.compile(r"<script\b(?![^>]*data-rk-inline)[^>]*\bsrc\s*=|<link\b(?![^>]*data-rk-inline)[^>]*\bhref\s*=", re.IGNORECASE), "an extra file: keep the game's code in index.html (a soundtrack, music.js, is the one exception: mark its tag data-rk-inline)"),
]


def check(game_dir, html):
    """Warn about anything the Retro Kit rules forbid. Returns the number of warnings."""
    count = 0
    for number, line in enumerate(html.splitlines(), start=1):
        for pattern, why in CHECKS:
            if pattern.search(line):
                print("  Warning: " + game_dir.name + "/index.html line " + str(number) + " has " + why + ".")
                count += 1
    return count


def check_inlined(game_dir, html):
    """Warn about copied-in files other than the kit and the soundtrack, and about a soundtrack that is
    not set up the allowed way. Returns the number of warnings."""
    music = (game_dir / "music.js").resolve()
    allowed = [(KIT / "retro-kit.css").resolve(), (KIT / "retro-kit.js").resolve(), music]
    notes = []
    has_music = False
    for tag in INLINE_RE.findall(html):
        ref = SRC_RE.search(tag) or HREF_RE.search(tag)
        if not ref:
            continue
        target = (game_dir / ref.group(1)).resolve()
        if target not in allowed:
            notes.append("index.html copies in " + ref.group(1) + ": only the kit's two files and a music.js beside index.html may be data-rk-inline")
        has_music = has_music or target == music
    if has_music:
        if not MUSIC_RE.fullmatch(read_text(music)):
            notes.append('music.js must hold only the soundtrack as text: one line of the form window.MY_GAME_MUSIC = "<the MP3 in base64>"')
        if not MUSIC_OPTION_RE.search(html):
            notes.append("index.html copies in music.js but never plays it: add music: { data: window.MY_GAME_MUSIC } to RetroKit.game")
    elif music.exists():
        notes.append('music.js is not copied in: add <script src="music.js" data-rk-inline></script> to the head of index.html')
    for note in notes:
        print("  Warning: " + game_dir.name + "/" + note + ".")
    return len(notes)


def build(game_dir):
    source = game_dir / "index.html"
    if not source.exists():
        fail(str(game_dir.name) + " has no index.html")
    html = read_text(source)
    check(game_dir, html)
    check_inlined(game_dir, html)
    if not SCRIPT_RE.search(html) or not LINK_RE.search(html):
        fail(game_dir.name + "/index.html must link retro-kit.css and retro-kit.js with data-rk-inline (see kit/template.html)")

    def swap_link(match):
        href = HREF_RE.search(match.group(0))
        if not href:
            fail("a data-rk-inline <link> has no href")
        return "<style>\n" + inline_css((game_dir / href.group(1)).resolve()) + "\n</style>"

    def swap_script(match):
        src = SRC_RE.search(match.group(0))
        if not src:
            fail("a data-rk-inline <script> has no src")
        return "<script>\n" + inline_js((game_dir / src.group(1)).resolve()) + "\n</script>"

    html = LINK_RE.sub(swap_link, html)
    html = SCRIPT_RE.sub(swap_script, html)
    DIST.mkdir(exist_ok=True)
    out = DIST / (game_dir.name + ".html")
    out.write_text(html, encoding="utf-8", newline="\n")
    size = out.stat().st_size / 1024
    print("  Built dist/" + out.name + " (" + str(round(size)) + " KB)")


def main():
    names = sys.argv[1:]
    if names:
        dirs = [GAMES / n for n in names]
        for d in dirs:
            if not d.is_dir():
                fail("no game folder called games/" + d.name)
    else:
        dirs = sorted(p for p in GAMES.iterdir() if p.is_dir() and (p / "index.html").exists()) if GAMES.exists() else []
        if not dirs:
            fail("no games found in games/")
    for d in dirs:
        build(d)
    print("Done. Open the file in dist/ to play.")


if __name__ == "__main__":
    main()
