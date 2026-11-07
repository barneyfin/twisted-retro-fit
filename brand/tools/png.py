"""Render the final SVGs to PNG at exact pixel sizes, transparent outside the artwork.
Usage: python3 png.py <svg dir> <png dir>"""
import sys, os, re, asyncio
from playwright.async_api import async_playwright

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)


def natural(name):
    vb = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', open(os.path.join(SRC, name)).read())
    return float(vb.group(1)), float(vb.group(2))


JOBS = [  # svg, png, height in px (width follows the artwork's shape)
    ("lbg-mark.svg", "lbg-mark-1024.png", 1024),
    ("lbg-mark.svg", "lbg-mark-256.png", 256),
    ("lbg-mark-small.svg", "lbg-mark-small-64.png", 64),
    ("lbg-mark-small.svg", "lbg-mark-small-32.png", 32),
    ("lbg-avatar.svg", "lbg-avatar-1024.png", 1024),
    ("lbg-avatar.svg", "lbg-avatar-512.png", 512),
    ("lbg-lockup-h-dark.svg", "lbg-lockup-h-dark@2x.png", 200),
    ("lbg-lockup-h-light.svg", "lbg-lockup-h-light@2x.png", 200),
    ("lbg-lockup-s-dark.svg", "lbg-lockup-s-dark@2x.png", None),
    ("lbg-credit.svg", "lbg-credit@2x.png", None),
]


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 2400, "height": 1400}, device_scale_factor=1)
        for src, out, h in JOBS:
            w0, h0 = natural(src)
            if h is None:
                h = round(h0 * 2)
            w = round(w0 * h / h0)
            tmp = os.path.join(os.path.dirname(OUT.rstrip("/")), "_render.html")
            with open(tmp, "w") as fh:
                fh.write(f'<html><body style="margin:0;background:transparent">'
                         f'<img id="i" src="file://{os.path.join(SRC, src)}" width="{w}" height="{h}" style="display:block"></body></html>')
            await pg.goto("file://" + tmp)
            await pg.wait_for_function("document.getElementById('i').complete")
            await pg.locator("#i").screenshot(path=os.path.join(OUT, out), omit_background=True)
            print(f"{w}x{h}  {out}")
        await b.close()


asyncio.run(main())
