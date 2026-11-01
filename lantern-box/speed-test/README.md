# Lantern Box speed test 1

Phase 1 of the Lantern Box kit (see the kit's PRD). Gloam Hallow's four places from the directions page, round 12, drawn **the kit way**: each layer of scenery is painted once, in tiles as the camera reaches it, and then only slid; things that move are drawn fresh every frame. A crowd of monsters and the place's boss load the picture, and the camera rises and falls by half a screen. The test page measures how fast each device draws it.

Published copy (shareable from its Share menu): https://claude.ai/artifact/9QdUjWZGR9XCEpYkyVQika (Version 3)

## Open it

Double-click `index.html`, or open it in Chrome. Tap **Run the test** and leave it alone for about half a minute; copy the result line it gives. The page uses two Google fonts; offline it falls back to the system's fonts, which doesn't change the timing in any way that matters.

Link endings, added after `index.html` (reload after adding one): `#res1` ordinary sharpness, `#crowd0` no crowd or boss, `#rise0` the camera stays level.

## Results (1 November 2026)

| Device | Picture | Night | Blood-red rain | Dawn | Mist | Slowest 5% / longest | Layer pictures |
|---|---|---|---|---|---|---|---|
| Pixel 11 Pro XL, Chrome 156 (PowerVR, Vulkan) | 1973 × 886 at 1.64× | 70 fps / 13.6 ms | 56 / 16.0 ms | 73 / 13.9 ms | 56 / 14.5 ms | 25 / 33 ms | 114 MB |
| Computer, Chrome 152 on Windows, RTX 5080 | 3840 × 2160 at 4.00× | 60 fps / 2.9 ms | 60 / 6.6 ms | 60 / 3.1 ms | 60 / 4.8 ms | 17 / 17 ms | 329 MB |

Each cell is frames a second / time to draw one frame. Both pass their targets (PRD criterion 1): on the phone at least 30 fps with every frame drawn in 25 ms or less, on the computer 60 fps. The computer's run was on Version 2, before the overhanging branches were pinned to the top edge (one more layer of tiles). The iPhone, the HP laptop, the Fire HD 8 and the computer's AMD graphics are measured and reported only.

## Rebuild

`index.html` is built from the files in `src/` and kept in git so the test runs straight from this folder. To rebuild it, in **PowerShell** (one command):

```
& "C:\Users\barne\AppData\Local\Programs\Python\Python312\python.exe" "C:\Users\barne\Documents\Calude Code\Retro Games\lantern-box\speed-test\build.py"
```

It prints `gated cases 23` and then `built index.html, 220044 characters`. The result is identical to the published Version 3.

## What's here

| File | What it is |
|---|---|
| `index.html` | The speed test, built. |
| `build.py` | Builds `index.html` from `src/`. |
| `src/directions-round12.html` | The Gloam Hallow directions page, round 12, final (signed off 1 November 2026). Its drawing code is used unchanged, apart from a few switches `build.py` adds. |
| `src/kit.js` | The kit way of drawing: tiles, monster poses painted once per step, the boss repainted 20 times a second, sprites for bats, crows and string lights, the rising camera, the crowd. The start of the kit's drawing tools. |
| `src/page.js`, `src/body.html`, `src/extra.css` | The test page: switches, the test run, the result line, full screen. |

## How it draws (for phase 3)

- Backdrop layers 1–4, the path's still parts, the front layer's ground plants and its overhanging branches are each painted into tiles 1024 screen pixels wide (with an 840-pixel margin so glows join up), at most one new tile per frame beyond those on screen, and slid each frame. The overhanging branches stay pinned to the top edge when the camera rises (Barney, 1 November 2026).
- Drawn fresh each frame: string lights and tree eyes (kept with their tile), lamps, candles, the potion, the shrine, the splashes, rain, lightning, mist bands, clouds, flyers, monsters, the boss, the wanderer, the HUD sketch.
- Puppet monsters are painted once per pose step and reused; the mouth-hat hops smoothly, so it's painted every frame. The boss is repainted 20 times a second. Bats and crows use 17 painted wing positions; each string light is one painted sprite. The sky and the dark edges are painted once.
- Suggestions for phase 3, not decided: cap the picture's sharpness on very large screens (memory grows with pixels: 329 MB at 4K); spread the heavier work across frames so frame times come out more even on the phone.
