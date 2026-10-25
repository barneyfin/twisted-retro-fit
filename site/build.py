#!/usr/bin/env python3
"""Twisted Retro Fit: the arcade website build.

Builds every game listed in site/games.json (with kit/build.py) and puts the whole website in _site/:
    _site/index.html          the front page: site/index.html with a card for each game
    _site/play/<name>.html    each built game
    _site/art/<name>.webp     the picture on each game's card (from site/art/)
    _site/licences/           the typefaces' licences

Run it from the Retro Games folder:
    python site/build.py

Then open _site/index.html to look. GitHub runs the same command each time main is pushed
(.github/workflows/publish-site.yml) and publishes _site/ as the website. _site/ is not kept in git.

A card's name, tagline, controls and modes come from the game's own index.html, so they always match the
game. games.json says which games are on the page, in what order, and adds what a game does not say about
itself: a genre, a "new" badge, a short description (blurb) and a description of its picture for screen
readers. To add a game: add an entry to games.json and a picture at site/art/<name>.webp (16:9).
Standard library only; Python 3.8 or newer.
"""
import html
import importlib.util
import json
import pathlib
import re
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
OUT = ROOT / "_site"
GAMES = ROOT / "games"
KIT = ROOT / "kit"
NOT_GAMES = {"kit-sampler"}   # the kit's test page, never on the arcade
ART_TYPES = (".webp", ".png", ".jpg")

JS_STRING = r"'((?:[^'\\]|\\.)*)'"   # a single-quoted string in a game's config
WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"]

ICON_PLAY = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="7,5 19,12 7,19"/></svg>'
ICON_KEYS = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8 14h8"/></svg>'
ICON_TOUCH = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M18.5 12h.01"/></svg>'


def fail(message):
    print("Site build failed: " + message)
    sys.exit(1)


def load_kit_build():
    """kit/build.py, loaded as a module so the site builds games (and copies the kit in) exactly as it does."""
    spec = importlib.util.spec_from_file_location("retro_kit_build", KIT / "build.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def js_unescape(text):
    return re.sub(r"\\(.)", lambda m: "\n" if m.group(1) == "n" else m.group(1), text)


def slug(text):
    """The kit's slug(): how it turns a mode's id or label into the id its high scores are saved under."""
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", text.lower()))


def read_config(name):
    """The parts of a game's RetroKit.game({...}) config the card shows."""
    source = (GAMES / name / "index.html").read_text(encoding="utf-8")
    start = source.find("RetroKit.game(")
    if start < 0:
        fail("games/" + name + "/index.html has no RetroKit.game(...)")
    cfg = source[start:]

    def field(key):
        m = re.search(r"^\s*" + key + r"\s*:\s*" + JS_STRING, cfg, re.M)
        return js_unescape(m.group(1)) if m else ""

    keys = []   # [(['←', '→'], 'Move'), ...]
    m = re.search(r"^\s*keys\s*:\s*\[(.*)\]\s*,?\s*(?://.*)?$", cfg, re.M)
    if m:
        for group in re.findall(r"\[([^\[\]]*)\]", m.group(1)):
            parts = [js_unescape(s) for s in re.findall(JS_STRING, group)]
            if len(parts) >= 2:
                keys.append((parts[:-1], parts[-1]))

    modes = []   # [('classic', 'Classic'), ...]
    m = (re.search(r"^\s*modes\s*:\s*\[(.*?)\]\s*,?\s*$", cfg, re.M)
         or re.search(r"^\s*modes\s*:\s*\[\s*$(.*?)^\s*\]", cfg, re.M | re.S))
    if m:
        block = m.group(1)
        for entry in re.findall(r"\{([^{}]*)\}", block):
            label = re.search(r"\blabel\s*:\s*" + JS_STRING, entry)
            ident = re.search(r"\bid\s*:\s*" + JS_STRING, entry)
            label = js_unescape(label.group(1)) if label else ""
            ident = slug(js_unescape(ident.group(1)) if ident else label)
            modes.append((ident, label or ident.capitalize()))
        if not modes:
            modes = [(slug(js_unescape(s)), js_unescape(s).capitalize()) for s in re.findall(JS_STRING, block)]

    title = field("title")
    if not title:
        fail("games/" + name + "/index.html has no title in its RetroKit.game config")
    return {"title": title, "tagline": field("tagline"), "touch": field("touch"), "keys": keys, "modes": modes}


def find_art(name):
    for ext in ART_TYPES:
        path = SITE / "art" / (name + ext)
        if path.exists():
            return path
    return None


def card(entry, cfg, art):
    e = html.escape
    name = entry["id"]
    plain_title = " ".join(cfg["title"].split())

    chips = ""
    if entry.get("genre"):
        chips += '<span class="rk-chip is-compact rk-hint">' + e(entry["genre"]) + "</span>"
    if entry.get("new"):
        chips += '<span class="rk-badge">New</span>'
    if art:
        screen = ('<div class="cab-screen"><img src="art/' + e(art.name) + '" width="1280" height="720" loading="lazy" decoding="async" alt="'
                  + e(entry.get("picture", plain_title)) + '">')
    else:
        screen = '<div class="cab-screen no-art">'
    if chips:
        screen += '<div class="cab-chips">' + chips + "</div>"
    screen += "</div>"

    body = '<p class="cab-blurb">' + e(entry.get("blurb", "")) + "</p>"
    if cfg["modes"]:
        body += ('<p class="cab-modes"><span class="rk-label">Modes</span>'
                 + "".join('<span class="mode">' + e(label) + "</span>" for _, label in cfg["modes"]) + "</p>")
    keys = [(k, action) for k, action in cfg["keys"] if action.lower() != "pause"]   # P pauses every game
    if keys:
        body += ('<div class="cab-ctl">' + ICON_KEYS + '<span class="sr">Keys: </span><div class="cab-keys">'
                 + "".join('<span class="key">' + "".join('<kbd class="rk-kbd">' + e(k) + "</kbd>" for k in ks)
                           + " " + e(action) + "</span>" for ks, action in keys)
                 + "</div></div>")
    if cfg["touch"]:
        body += '<div class="cab-ctl">' + ICON_TOUCH + '<p><span class="sr">On a phone: </span>' + e(cfg["touch"]) + "</p></div>"
    body += ('<div class="cab-foot">'
             '<p class="cab-best" hidden><span class="rk-label">Your best</span> <span class="rk-num">0</span> <span class="cab-initials"></span></p>'
             '<a class="rk-btn is-primary cab-play" href="play/' + e(name) + '.html" aria-label="Play ' + e(plain_title.title()) + '">' + ICON_PLAY + "Play</a>"
             "</div>")

    # Where the game saves its high scores (see the kit's scoreKey), so the page can show the player's best
    base = "retrokit.scores." + name
    scores = " ".join([base] + [base + "." + ident for ident, _ in cfg["modes"]])

    return ('      <article class="cab rk-panel" data-scores="' + e(scores) + '">\n'
            '        <header class="cab-marquee"><h3 class="cab-title rk-logo"><span>' + e(cfg["title"]) + "</span></h3>"
            '<p class="cab-tag">' + e(cfg["tagline"]) + "</p></header>\n"
            "        " + screen + "\n"
            '        <div class="cab-body">' + body + "</div>\n"
            "      </article>")


def main():
    kit_build = load_kit_build()
    try:
        listed = json.loads((SITE / "games.json").read_text(encoding="utf-8"))["games"]
    except (OSError, ValueError, KeyError) as err:
        fail("cannot read site/games.json (" + str(err) + ")")
    names = [g.get("id", "") for g in listed]
    for name in names:
        if not (GAMES / name / "index.html").exists():
            fail("site/games.json lists '" + name + "', but there is no games/" + name + "/index.html")
    if len(set(names)) != len(names):
        fail("site/games.json lists a game twice")

    print("Building the games:")
    for name in names:
        kit_build.build(GAMES / name)

    cards = []
    for entry in listed:
        art = find_art(entry["id"])
        if not art:
            print("  Warning: no picture for " + entry["id"] + ": add site/art/" + entry["id"] + ".webp (16:9). Its card shows a plain sky for now.")
        cards.append(card(entry, read_config(entry["id"]), art))

    page = (SITE / "index.html").read_text(encoding="utf-8")
    match = kit_build.LINK_RE.search(page)
    if not match:
        fail("site/index.html must link the kit's stylesheet with data-rk-inline")
    href = kit_build.HREF_RE.search(match.group(0)).group(1)
    css = kit_build.inline_css((SITE / href).resolve())
    page = page[:match.start()] + "<style>\n" + css + "\n</style>" + page[match.end():]
    version = re.search(r"const VERSION = '([\d.]+?)(?:\.0)?'", (KIT / "retro-kit.js").read_text(encoding="utf-8"))
    count = len(listed)
    word = WORDS[count] if count < len(WORDS) else str(count)
    for marker, value in (("{{GAMES}}", "\n".join(cards)), ("{{COUNT}}", word), ("{{COUNT_CAPS}}", word.upper()),
                          ("{{COUNT_LOWER}}", word.lower()), ("{{KIT_VERSION}}", version.group(1) if version else "")):
        page = page.replace(marker, value)

    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "play").mkdir(parents=True)
    (OUT / "art").mkdir()
    (OUT / "licences").mkdir()
    (OUT / "index.html").write_text(page, encoding="utf-8", newline="\n")
    for name in names:
        shutil.copyfile(ROOT / "dist" / (name + ".html"), OUT / "play" / (name + ".html"))
        art = find_art(name)
        if art:
            shutil.copyfile(art, OUT / "art" / art.name)
    for licence in sorted((KIT / "licences").glob("*.txt")):
        shutil.copyfile(licence, OUT / "licences" / licence.name)

    for game in sorted(p.name for p in GAMES.iterdir() if (p / "index.html").exists()):
        if game not in names and game not in NOT_GAMES:
            print("  Note: games/" + game + " is not on the arcade page: add it to site/games.json to show it.")
    size = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file()) / (1024 * 1024)
    print("Built _site/ with " + str(count) + " games (" + str(round(size, 1)) + " MB). Open _site/index.html to look.")


if __name__ == "__main__":
    main()
