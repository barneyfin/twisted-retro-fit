# City Nights

The arcade's second style kit: a real Hong Kong street at night, after Barney's photo series *Hong Kong City Nights*. Warm amber streets under a wall of lightbox and neon signs, grain and glow, ghosted people, traffic. Games look into the screen, down the street. The pilot game, **Grunge City Rider** (a taxi game), comes in phase 4.

It is not Retro Kit: it has its own look, its own drawing (WebGL2) and its own folder. The rules for every kit and game are in `ARCADE.md` at the top of the repository; City Nights' own rulebook is its design system (`design-system\README.md`).

## Play a game

Double-click any City Nights file in `dist\` (`cn-sampler.html`, `cn-empty.html`, and the games as they come). Each one is a single self-contained file: it works offline and can be copied anywhere. It needs a browser with WebGL2, which every current Chrome, Safari, Edge and Firefox has; an older browser gets a message saying so.

City Nights games are not on the arcade's website yet: `site\build.py` learns them in phase 4.

## Rebuild by hand

In **PowerShell** (one command, it works from any folder):

```powershell
& "C:\Users\barne\AppData\Local\Programs\Python\Python312\python.exe" "C:\Users\barne\Documents\Calude Code\Retro Games\city-nights\kit\build.py"
```

That rebuilds every City Nights game into `dist\` and prints one line per game, such as `Built dist/cn-sampler.html (506 KB)`, plus a warning for anything a game does that the kit's rules forbid: colour codes instead of the kit's named colours, network addresses, image files, Chinese characters missing from the fonts, things that flash too fast. A game is finished only when it builds with no warnings. To rebuild just one, add its folder name to the end of the command.

## Make a new game

Until the City Nights skill is written (phase 5), start from the template:

1. Copy `kit\template.html` to `games\<name>\index.html` (lowercase, hyphens, and not the name of a Retro Kit game).
2. Change `id` to the folder name, give it a `title`, and if it has a Chinese name, check every word is on the word list (`design-system\words.md`) first. A new word goes to Barney's Claude app project, where the word list lives and the fonts are re-cut.
3. Write the game's rules in `start()` and `update()`. The kit draws the street every frame; the game only moves what is on it (`cn.street`: the taxi, the traffic, the power-ups, obstacles, animals, the stop bay and its passenger, a crash) and sets the meter's time (`cn.meter`). The fare is the score. Everything a game can use is listed in `kit\city-nights.js` under "Public API".
4. Build it with the command above.

The template, as it is, drives up the street through traffic: a working game to start from.

## The test page

`dist\cn-sampler.html` shows every part of the kit. Press **Start game**; in play, keys **1** to **6** change scene (on a phone, tap the street for the next one). A plaque at the top left names the scene and shows the frame rate and the picture it is drawing.

| Scene | What it shows |
|---|---|
| 1 Drive | All four districts (Tsim Sha Tsui, Jordan, Yau Ma Tei, Mong Kok), the signs, people and traffic, the meter and the district caption. Steer with ← →, brake with ↓. TIME counts down, and at 00 the run ends: game over, initials and high scores follow. |
| 2 Mong Kok | The speed check (below). |
| 3 Power-ups | The five power-up signs (時 錢 快 保 雙), near and far. |
| 4 Crash | The taxi runs into each kind of vehicle in turn: the crash pop and the brake lights. The words come in turn, CRASH!, SMASH!, BANG!, then one the kit picks at random (as a game gets it); press C, S or B to choose the next word, R for a random one. The plaque shows how long the crash pop's three words took to draw. |
| 5 Vehicles | Every vehicle in every colour, keeping pace with the taxi. |
| 6 Street | The street's pieces, laid out ahead of the taxi each lap: roadworks closing the left lane, an oil slick, spilt cargo and a flooded pothole; the wild boar, the stray dog, the street cat and the market chickens, each bolting for the kerb as the taxi comes; a passenger waving at the pick-up bay (plain, with a suitcase, then with shopping, one each lap), then the drop-off bay. ↓ slows down. |

Pause (Esc, or the pause tile) and Settings work as in any game, so every screen can be seen. After changing anything in `kit\`, rebuild every City Nights game and look through this page before anything else.

## The speed check

Scene 2 repeats the speed test's Mong Kok measurement, now on the finished kit. It starts by itself: the taxi goes to the edge of Mong Kok and drives through it at 68 km/h, three times, about 21 seconds in all. For the first part every frame is timed (the frame rate); for the next 3 seconds each frame is drawn eight times over, so the picture slows down on purpose while it works out how long one frame takes to draw. The second run does the same with a crash pop lit all the while (a new one each second), and the third with street pieces on screen: roadworks, oil, spilt cargo, a pothole, the chickens and the boar, and a passenger at the pick-up bay. Each run starts again from the edge of Mong Kok, so all three are measured on the same street. Leave the page alone until the plaque shows the result.

Close any other copy of the page first (two copies fight over the graphics chip), and use Chrome. The result names the frame rate and the time to draw a frame for each run (the street alone, with a crash pop, with street pieces); whether each target passes (on all three runs); how long the crash pop's three words took to draw; the picture size and smoothing, the browser and the graphics chip. The targets, as in the speed test:

- **Phone**: at least 30 frames a second, and each frame drawn in 25 ms or less.
- **Computer**: 60 frames a second.

The crash pop's words are slow to draw (each has up to 15 glows), so the kit draws all three once, while the title screen shows and again after the window changes size, and each pop just shows the finished picture. The time it reports is that drawing: on a slow device the title's street pauses for that long once, and a resize during play costs the same pause.

The check waits until Automatic (below) has finished timing the picture. To run it again, press 2, or tap through the scenes back to it.

Check that the result names the device's own graphics chip. "Microsoft Basic Render Driver" (or "SwiftShader") means Chrome is drawing without it, and the numbers are meaningless: restart Chrome completely, and check `chrome://gpu` says WebGL2 is hardware accelerated. The frame rate in the plaque's top line dips while each frame is drawn eight times (three times in the check, 3 seconds each); the result line is the one to read. Chrome on Android always names itself "Android 10", whatever the phone runs.

### Results, 29 October 2026 (kit 0.4, Mong Kok, Chrome 156)

| Device | Frame rate | Time to draw a frame | Picture | Targets |
|---|---|---|---|---|
| Computer, RTX 5080 | 60 fps | under 2.1 ms | 1632 × 810, 4× smoothing | pass |
| Pixel 11 Pro XL | 60 fps | about 3.2 ms | 1944 × 810, 4× smoothing | pass |

Both match the speed test (computer under 2.1 ms, Pixel about 3.1 ms), and Automatic kept Best on both. In both runs the slowest 1 frame in 20 came 17 ms after the one before, one refresh of a 60 Hz screen.

### Results, 29 October 2026 (kit 0.6, Mong Kok, Chrome 156)

Kit 0.5 added the run with a crash pop lit and the words' drawing time; kit 0.6 added the run with street pieces.

| Device | Street alone | With a crash pop | With street pieces | Crash pop words drawn | Picture | Targets |
|---|---|---|---|---|---|---|
| Computer, RTX 5080 | 60 fps, under 2.1 ms | 60 fps, under 2.1 ms | 60 fps, under 2.1 ms | 38 ms, 2859 × 1853 each | 1632 × 810, 4× smoothing | pass |
| Pixel 11 Pro XL | 60 fps, about 3.2 ms | 60 fps, about 3.2 ms | 60 fps, about 3.2 ms | 100 ms, 1089 × 706 each | 1944 × 810, 4× smoothing | pass |

Neither the crash pop nor the street pieces changed the time to draw a frame on either device, and both match kit 0.4's results. The slowest 1 frame in 20 came 17 ms (computer) and 18 ms (Pixel) after the one before. Drawing the crash pop's words is a one-off pause while the title screen shows: about two frames on the computer, six on the Pixel.

## Picture: Automatic, Best, Faster, Fastest

Under Settings. **Best** is 4× edge smoothing at full sharpness (up to 1.5 canvas pixels for each pixel of the 540-line picture, on sharp screens). **Faster** turns edge smoothing off. **Fastest** also draws at ordinary sharpness, one canvas pixel per picture pixel.

**Automatic**, the setting a player starts with, begins at Best and times the first seconds of play, once a visit. After a second to settle, it counts two seconds of frames. If they come more than 17.5 ms apart on average (fewer than about 57 a second), it turns edge smoothing off and times again; if they are still more than 25 ms apart (fewer than 40 a second), it draws at ordinary sharpness. A 60 Hz screen shows a frame every 16.7 ms, which is why the first step is at 17.5 ms rather than 16: a device that keeps up never trips it. What Automatic finds is kept until the page closes, not saved, so a device is timed afresh on each visit.

## What's where

| Path | What |
|---|---|
| `HANDOVER.md` | The note that handed phase 3 to Claude Code: what was decided and the steps |
| `design-system\` | A copy of the approved design system (the spec): tokens, components, the word list, the fonts |
| `speed-test\` | Phase 1's WebGL2 speed test, kept as it is |
| `kit\city-nights.css` | The look: colours, fonts, lightbox and neon signs |
| `kit\city-nights.js` | The kit: the street and everything on it, the game shell, sound, saving, the Picture setting. The crash pop's drawings, the street's pieces and the code that draws them are copied unchanged from the design system (`design-system\components\bundle.js`) |
| `kit\build.py` | Turns a game's source into one playable file, and checks it against the rules |
| `kit\template.html` | Starting point for a new game |
| `kit\fonts\`, `kit\licences\` | The six font files and their licences (SIL Open Font License: free to embed in games); Bangers is for the crash pop's letters only. `fonts\characters.txt` lists the Chinese characters the fonts hold, for the build's check |
| `games\cn-sampler\` | The test page |
| `games\cn-empty\` | The template as a game, to prove the template builds |
| `..\dist\<name>.html` | The built games, shared with Retro Kit's (not kept in git) |

Settings are saved in the browser on each device and shared with every game in the arcade (volume, effects, reduce motion); Picture is City Nights' own. High scores are kept per game in the arcade's format, the fare in whole cents, where the website will find them.
