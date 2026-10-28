# City Nights speed test

Phase 1 of the City Nights kit (see the PRD): the round 9 street redrawn with WebGL2 at full detail, with a frame-rate test. It proved the WebGL route on 28 October 2026. In phase 3 its drawing code becomes the start of the kit's drawing tools.

## Run it

Open `index.html` in Chrome. It needs an internet connection the first time, because this test loads its fonts from Google Fonts (the finished kit will carry its own). Press **Run the Mong Kok test**: it drives through Mong Kok for about 7 seconds and reports the frame rate and the time to draw a frame. For the last 3 seconds it draws every frame eight times over to time it, so the picture slows down on purpose. Close any other copy of the page first, or the copies compete for the graphics chip.

Settings for testing, added to the end of the address and followed by a reload:

| Ending | Effect |
|---|---|
| `#smooth0` | No edge smoothing |
| `#smooth2` | 2× edge smoothing instead of 4× |
| `#res1` | Ordinary sharpness (no extra pixels on sharp screens) |

## Build it

`index.html` is built from the four files in `src/`, joined in order:

| File | What it holds |
|---|---|
| `head.html` | The page, its styles and the readout panels |
| `street-gen.js` | The round 9 street, unchanged from the directions page: signs, look, track, buildings, people, traffic, and the 2D drawing of signs, figures and vehicles done once at load |
| `gl.js` | The WebGL2 drawing: the street built once into buffers on the graphics chip, the shaders, glow, fog, vignette, grain and the taxi |
| `tail.js` | The meter, sizing, the measuring and the page's buttons |

To rebuild after changing a file in `src/`, in PowerShell:

```
cd "C:\Users\barne\Documents\Calude Code\Retro Games\city-nights\speed-test"
C:\Users\barne\AppData\Local\Programs\Python\Python312\python.exe build.py
```

It prints the size and a checksum of the new `index.html`.

## How it draws

- The street is built once into four buffers on the graphics chip: the road; the buildings with their poles and light fittings; the pools and reflections on the wet road; the hanging signs. Each corner is stored as (segment, distance along it, across, up), and the vertex shader projects it from a small table of where each segment ahead sits on screen. Only that table changes each frame.
- People, traffic and the cab ground are small batches made each frame. The taxi has its own shader, lit by the street's glow.
- Each surface writes its grain level into a second buffer as it's drawn (option 2). Glow, fog, vignette and grain are applied in one pass at the end.
- Signs, figures, cars and glows are drawn once with the 2D canvas into a 3-layer texture.
- The meter is a small canvas over the corner, redrawn only when a number changes. It is 82.5% of its round 9 size (Barney, 28 October 2026).

## Results, 28 October 2026 (Mong Kok, Chrome unless stated)

| Device | Frame rate | Time to draw a frame |
|---|---|---|
| Computer, RTX 5080 | 60 fps | under 2.1 ms |
| Computer, AMD built-in graphics | 60 fps | about 6.3 ms |
| Pixel 11 Pro XL | 60 fps | about 3.1 ms |
| iPhone, about five years old, sideways (Safari) | 59 fps | about 13.8 ms |
| Laptop, Intel HD Graphics 520 | 41 fps; 60 with `#smooth0` | about 20.8 ms; 12.5 |
| Fire HD 8 (Silk) | 27–29 fps; 43 with `#smooth0` | about 31 ms; 23 |

Targets: at least 30 fps on the phone with each frame drawn in 25 ms or less; 60 fps on the computer. Both pass.

Slower devices (PRD open question 9, decided by Barney on 28 October 2026): the game times its first few seconds and turns edge smoothing off if frames take longer than about 16 ms, then lowers the sharpness if they still take longer than 25 ms; players can override it in the settings. Built in phase 3.
