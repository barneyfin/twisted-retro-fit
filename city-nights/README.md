# City Nights

The arcade's second style kit: a real Hong Kong street at night, after Barney's photo series *Hong Kong City Nights*. Warm amber streets under a wall of lightbox and neon signs, grain and glow, ghosted people, traffic. Games look into the screen, down the street. The pilot game is **Grunge City Rider** (a taxi game): `dist\grunge-city-rider.html`, its rules in `GAMEPLAY-grunge-city-rider.md`, its starting figures together at the top of `games\grunge-city-rider\index.html`, for tuning.

It is not Retro Kit: it has its own look, its own drawing (WebGL2) and its own folder. The rules for every kit and game are in `ARCADE.md` at the top of the repository; City Nights' own rulebook is its design system (`design-system\README.md`).

## Play a game

Double-click any City Nights file in `dist\` (`grunge-city-rider.html`, `cn-sampler.html`, `cn-empty.html`). Each one is a single self-contained file: it works offline and can be copied anywhere. It needs a browser with WebGL2, which every current Chrome, Safari, Edge and Firefox has; an older browser gets a message saying so.

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
3. Write the game's rules in `start()` and `update()`. The kit draws the street every frame; the game only moves what is on it (`cn.street`: the taxi, the traffic, the power-ups, obstacles, animals, the stop bay and its passenger, a crash) and sets the meter's time (`cn.meter`). Traffic that moves along with the taxi goes through `cn.street.recycle(cars)` each step, so it stays round the taxi on the long street, as the template does. The fare is the score. Everything a game can use is listed in `kit\city-nights.js` under "Public API".
4. Build it with the command above.

The template, as it is, drives up the street through traffic: a working game to start from.

## The test page

`dist\cn-sampler.html` shows every part of the kit. Press **Start game**; in play, keys **1** to **9**, **0**, **-**, **=**, **[** and **]** change scene (on a phone, tap the street for the next one). A plaque at the top left names the scene and shows the frame rate, the kit's version and the picture it is drawing; in scenes 1, 2, 7 and 14 a fourth line shows the graphics memory and the opening times (the speed check, below).

| Scene | What it shows |
|---|---|
| 1 Drive | All four districts (Tsim Sha Tsui, Jordan, Yau Ma Tei, Mong Kok), the signs, people and traffic, the meter and the district caption. Steer with ← →, brake with ↓; N jumps to just before the next district's edge, and holding F drives at 100 m/s (360 km/h), to see the long street end to end. TIME counts down, and at 00 the run ends: game over, initials and high scores follow. |
| 2 Mong Kok | The speed check (below). |
| 3 Power-ups | The five power-up signs (時 錢 快 保 雙), near and far. |
| 4 Crash | The taxi runs into each kind of vehicle in turn, then roadworks: the crash pop, the brake lights and the two crash sounds. The words come in turn, CRASH!, SMASH!, BANG!, then one the kit picks at random (as a game gets it); press C, S or B to choose the next word, R for a random one. The plaque shows how long the crash pop's three words took to draw. |
| 5 Vehicles | Every vehicle in every colour, keeping pace with the taxi. |
| 6 Street | The street's pieces, laid out ahead of the taxi each lap: roadworks closing the left lane, an oil slick, spilt cargo and a flooded pothole; the wild boar, the stray dog, the street cat and the market chickens, each bolting for the kerb as the taxi comes; a passenger waving at the pick-up bay (plain, with a suitcase, then with shopping, one each lap), then the drop-off bay. ↓ slows down. |
| 7 Long street | Each district in turn, from 150 m before its edge (60 m before its tunnel's portal), for 15 seconds at 84 km/h (快's speed) with traffic, while the street is made a piece at a time; then again. After all four, about a minute, the plaque shows the frame rate, the slowest frames, and how many pieces of street were made and how long each took. On a phone this is the way to see every district. |
| 8 Play screen | Grunge City Rider's play screen (design system v10), a state at a time, 3.5 seconds each, named on the plaque: mid-fare with everything at once (lives, the tip counting, the caption's round line and lamps, the drop-off pin far off, the 快 保 雙 badges with 快 emptying and 保's ring, the roof sign out); a fare paid (the receipt slip); a pick-up ahead (the teal pin, counting down); in the bay (the bay's ring, 保's ring stepping aside, the pin with no tag); getting in (the passenger fading, the roof sign going out); the tip halved and the tip lost (their receipts, the tip's dashes); lives from 3 to 0 and the lamps from 0 to 5. |
| 9 Moments | Each in turn, laid out ahead of the taxi: the shielded hit on a car (the SAFE! sign over the taxi's roof, the car cleared away, 保's badge and ring gone, no freeze), the shielded hit on roadworks (the SAFE! sign over the barrier), a crash into roadworks (the crash pop, the barriers cleared away, the taxi moved into the open lane in the pop's first second), and the zone change (the street dims, the caption grows into the title of the district finished with its lamps and takings, the taxi jumps to the next district, the title of the new one and its round, then back into the caption). |
| 0 Touch | The touch zones outlined (only here; nothing marks them in a game): from the top of the meter's case down, either side of the taxi. A touch that starts outside them does nothing, so here a tap over the street does not change scene. Drag in either to steer (either thumb), two thumbs down to slow; a tap inside an outline goes to the next scene, Sound. |
| - Sound | A jump along the street, under a zone title as in a game, to 10 seconds before a district line where the music switches: into Yau Ma Tei (Meter Running High), then next time from Mong Kok round into Tsim Sha Tsui (Midnight Fare Dash). The plaque names what is happening and shows the slowest frame after the jump and after the music switches, and a log by the meter's reading of the jumps, the switches and any slow frame. Then 32 seconds for the new track to build, since both start very quietly, then the city sound bed a step louder every 9 seconds (0, 0.15, 0.25, 0.35, 0.5, 0.7; the plaque names the step). For choosing the sound bed's loudness by ear; leaving the scene puts it back. |
| = Tunnel | A loop on demand: a zone title puts the taxi 150 m before a district's end; it drives through the portal, loops at the district line, and comes out at the start of the same district; then the next district. Nothing in view should change at the loop, the caption should stay and the traffic should carry on. The plaque counts the loops and shows the slowest frame after the last. |
| [ Bays | The stop bay (design system v13), a still every 3 seconds, named on the plaque: at 35, 20 and 12 m ahead, from the middle lane and from its own, then with the taxi three-quarters in and all the way in; teal and pink; with a street lamp over its middle and midway between two. Steering still works. On a phone, the first two stills also show Grunge City Rider's touch hint, "Left: drag to steer · Right: hold to brake", as a sample: this page itself keeps either thumb. |
| ] Bay drive | Mong Kok at 70 km/h with traffic, a bay every 140 m, teal and pink in turn, each staying until the taxi has passed it. Every frame is timed, and each minute the plaque shows the frame rate, the slowest 1 frame in 20 and the slowest of all. |

On a phone held sideways, the meter, the district caption and the receipt slip keep clear of the camera and the screen's rounded corners (the safe-area insets, as the design system's README asks), as the tiles always have.

Pause (Esc, or the pause tile) and Settings work as in any game, so every screen can be seen. After changing anything in `kit\`, rebuild every City Nights game and look through this page before anything else.

## The speed check

Scene 2 repeats the speed test's Mong Kok measurement, now on the finished kit. It starts by itself: the taxi goes to the edge of Mong Kok and drives through it at 68 km/h, four times, then times a zone change and a run through a tunnel: about 50 seconds in all. For the first part every frame is timed (the frame rate); for the next 3 seconds each frame is drawn eight times over, so the picture slows down on purpose while it works out how long one frame takes to draw. The second run does the same with a crash pop lit all the while (a new one each second), the third with street pieces on screen: roadworks, oil, spilt cargo, a pothole, the chickens and the boar, and a passenger at the pick-up bay; and the fourth with the whole play screen on top of those (the pin, the badges, 保's ring, the caption's round line and lamps, the meter with lives and the tip, and a receipt always showing). Each run starts again from the edge of Mong Kok, so all four are measured on the same street. Next comes a zone change, whose frames are timed: its cross-fade draws two pictures a frame, and its jump makes new pieces of street. Last comes a run through a tunnel: the approach, inside, the loop at the district line and coming out, every frame timed, then a frame timed deep inside. Leave the page alone until the plaque shows the result.

Close any other copy of the page first (two copies fight over the graphics chip), and use Chrome. The result names the frame rate and the time to draw a frame for each run (the street alone, with a crash pop, with street pieces, with the whole play screen, through a tunnel); the zone change's cross-fade frame rate and its slowest frames; the loop's slowest frame; whether each target passes (on all five runs); how long the crash pop's three words took to draw; the picture size and smoothing, the browser and the graphics chip. The targets, as in the speed test:

- **Phone**: at least 30 frames a second, and each frame drawn in 25 ms or less.
- **Computer**: 60 frames a second.

The crash pop's words are slow to draw (each has up to 15 glows), so the kit draws all three once, while the title screen shows and again after the window changes size, and each pop just shows the finished picture. The time it reports is that drawing: on a slow device the title's street pauses for that long once, and a resize during play costs the same pause.

The check waits until Automatic (below) has finished timing the picture. To run it again, press 2, or tap through the scenes back to it.

**Graphics memory and opening times** (kit 0.7): the plaque's fourth line, in scenes 1, 2 and 7, shows what the kit has put on the graphics chip, in MB (the street's shapes, other buffers, textures, and the picture's buffers), and three times from opening the page: how long building the street took, when Start game began to work, and when the first street picture showed. It is the kit's own count of what it asked for; on the computer, Chrome's Task Manager (Shift+Esc, the GPU memory column) shows what the driver really uses.

Check that the result names the device's own graphics chip. "Microsoft Basic Render Driver" (or "SwiftShader") means Chrome is drawing without it, and the numbers are meaningless: restart Chrome completely, and check `chrome://gpu` says WebGL2 is hardware accelerated. The frame rate in the plaque's top line dips while each frame is drawn eight times (five times in the check, 3 seconds each); the result line is the one to read. Chrome on Android always names itself "Android 10", whatever the phone runs.

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

### Results, 30 October 2026 (kit 0.7, the long street, Chrome 156)

Measured on the Pixel, from a copy of the test page opened in Chrome from the phone's Files app, with no other tab open. The computer's results for the long street are under kit 0.10, below.

| Device | Street alone | With a crash pop | With street pieces | Crash pop words drawn | Picture | Targets |
|---|---|---|---|---|---|---|
| Pixel 11 Pro XL | 60 fps, about 3.1 ms | 60 fps, about 3.2 ms | 60 fps, about 3.1 ms | 83 ms, 1089 × 706 each | 1944 × 810, 4× smoothing | pass |

The long street made no difference to the time to draw a frame; the slowest 1 frame in 20 came 18 ms after the one before, as with kit 0.6.

| Pixel 11 Pro XL | Kit 0.6.1 (560 m) | Kit 0.7 (14.8 km) |
|---|---|---|
| Building the street when the page opens | 2.89 s | 2.86 s (planning it 69 ms, its first pieces 22 ms) |
| Start game worked | 3.16 s after opening | 3.27 s after opening |
| The street's shapes on the graphics chip | 10.6 MB (worked out in the app's browser) | 3.8 to 4.8 MB |
| Graphics memory in all (the kit's count) | not counted | 249 to 256 MB: textures 172 to 178, picture buffers 72 |
| Long street (scene 7): all four districts at 84 km/h | | 60 fps; slowest 1 in 20 came 18 ms apart, the slowest of all 20 ms; 88 pieces made, 1.9 ms each |

Opening times vary from run to run by more than the difference between the kits: a first run of kit 0.7, with eight other tabs open, took 3.62 s to build the street. Kit 0.6.1's time comes from a copy of its test page with a timer added, made for this comparison. Making the street a piece at a time never held up a frame: the slowest frame in the whole tour came 20 ms after the one before, against 16.7 ms for one refresh of the screen.

### Results, 30 October 2026 (kit 0.10, the computer, Chrome 156)

| Device | Street alone | With a crash pop | With street pieces | Crash pop words drawn | Picture | Targets |
|---|---|---|---|---|---|---|
| Computer, RTX 5080 | 60 fps, under 2.1 ms | 60 fps, under 2.1 ms | 60 fps, under 2.1 ms | 47 ms, 2859 × 1853 each | 1632 × 810, 4× smoothing | pass |

| Computer, RTX 5080 | Kit 0.10 (14.8 km) |
|---|---|
| Building the street when the page opens | 772 ms (planning it 34 ms, its first pieces 8 ms) |
| Start game worked | 0.94 s after opening |
| The street's shapes on the graphics chip | 3.9 to 4.8 MB |
| Graphics memory in all (the kit's count) | 243 to 248 MB: textures 178 to 183, picture buffers 61 |
| Long street (scene 7): all four districts at 84 km/h | 60 fps; slowest 1 in 20 came 17 ms apart, the slowest of all 17 ms; 88 pieces made, 0.6 ms each |

The time to draw a frame is the same as kits 0.4 and 0.6, and making the street a piece at a time never held up a frame. These three runs do not have the whole play screen on at once; kit 0.10.1, below, adds that as a fourth run.

### Results, 30 October 2026 (kit 0.10.1, the whole play screen and the zone change, Chrome 156)

The computer ran the page with both soundtracks; the Pixel ran a copy without them, in full screen, with its screen at 120 Hz.

| | Computer, RTX 5080 | Pixel 11 Pro XL |
|---|---|---|
| Street alone | 60 fps, under 2.1 ms | 120 fps, about 3.1 ms |
| With a crash pop | 60 fps, under 2.1 ms | 120 fps, about 3.1 ms |
| With street pieces | 60 fps, under 2.1 ms | 120 fps, about 3.1 ms |
| With the whole play screen | 60 fps, under 2.1 ms | 120 fps, about 3.2 ms |
| Slowest 1 frame in 20 came | 17 ms apart | 9 ms apart |
| Zone change's cross-fade | 60 fps, slowest frame 18 ms | 120 fps, slowest frame 9 ms |
| Slowest frame of the whole zone change | 18 ms | 11 ms |
| Crash pop words drawn | 52 ms, 2859 × 1853 each | 114 ms, 1329 × 861 each |
| Picture | 1632 × 810, 4× smoothing | 1803 × 810, 4× smoothing |
| Targets | pass | pass |
| Building the street when the page opens | 891 ms (planning it 35 ms, its first pieces 7 ms) | 2.76 s (planning it 69 ms, its first pieces 23 ms) |
| Start game worked, and the first picture | 1.05 s after opening | 3.06 s after opening |
| Graphics memory in all (the kit's count) | 254 MB: street shapes 4.8, other buffers 0.4, textures 188, picture buffers 61 | 261 MB: street shapes 4.1, other buffers 0.4, textures 190, picture buffers 67 |
| GPU memory (Chrome's Task Manager) | 153 MB | not read |
| Memory footprint (Chrome's Task Manager) | 228 MB, with both soundtracks | not read |
| The built file | 11.6 MB, with both soundtracks | 749 KB, without them |

With everything on screen, the time to draw a frame is the same as the street alone on both devices, and the zone change's cross-fade and its jump held up no frame. The computer's 228 MB includes the two decoded soundtracks, about 119 MB worked out from their length (337 s of stereo); the footprint was not read without them. Its 153 MB is what Chrome reports the page really using on the graphics chip, against the 254 MB the kit asked for, a reading taken on one run. Opening times vary from run to run. On the Pixel with both soundtracks (kit 0.10.2), Barney saw no glitch through scene 11's jumps and switches, the music did not stutter at a switch, and the page opened with the street built in 2.98 s (planning it 56 ms, its first pieces 22 ms) and Start game working at 3.23 s, against 3.06 s without the soundtracks: about the variation between any two runs. Its speed check, in full screen with both soundtracks: 120 fps on all four runs, about 3.2 ms a frame, slowest 1 frame in 20 came 9 ms apart; the zone change's cross-fade at 120 fps, its slowest frame 12 ms; crash pop words drawn in 121 ms, 1329 × 861 each; a 1803 × 810 picture with 4× smoothing; both targets pass; 262 MB of graphics memory by the kit's count (street shapes 4.4, other buffers 0.4, textures 190, picture buffers 67). The soundtracks made no difference to the frames.

### Results, 31 October 2026 (kit 0.11.3, the tunnels, Chrome 156)

The Pixel in full screen with its screen at 120 Hz, from the copy of the test page without the soundtracks; the computer from the page with both.

| | Computer, RTX 5080 | Pixel 11 Pro XL |
|---|---|---|
| Street alone, with a crash pop, with street pieces | 60 fps, under 2.1 ms, each | 120 fps, about 3.1 ms, each |
| With the whole play screen | 60 fps, under 2.1 ms | 120 fps, about 3.2 ms |
| Slowest 1 frame in 20 came | 17 ms apart | 9 ms apart |
| Zone change's cross-fade | 60 fps, slowest frame 17 ms | 120 fps, slowest frame 9 ms |
| Slowest frame of the whole zone change | 17 ms | 10 ms |
| **Through a tunnel** | **60 fps, under 2.1 ms, slowest frame 17 ms** | **120 fps, about 2.1 ms, slowest frame 20 ms** |
| **The loop's jump** | **slowest frame 17 ms** | **slowest frame 10 ms** |
| Crash pop words drawn | 38 ms, 2859 × 1853 each | 156 ms, 1329 × 861 each |
| Picture | 1632 × 810, 4× smoothing | 1803 × 810, 4× smoothing |
| Targets | pass | pass |
| Building the street when the page opens | 777 ms (planning it 34 ms, its first pieces 6 ms) | 3.17 s (planning it 61 ms, its first pieces 19 ms) |
| Start game worked, and the first picture | 0.89 s after opening | 3.36 s after opening |
| Graphics memory in all (the kit's count) | 243 to 253 MB: street shapes 3.5 to 4.5, other buffers 0.4, textures 178 to 188, picture buffers 61 | 260 MB: street shapes 2.6, other buffers 0.4, textures 190, picture buffers 67 |

A frame takes less to draw inside a tunnel than on the street. The loop's jump, making its new pieces there and then, held up no frame that shows: 10 ms against 8.3 ms for one refresh of the screen, and Barney could not see it in scene 12. The face fitted on the atlas's existing pages: textures are 190 MB, as on kit 0.10.1. Opening is 3.36 s against 3.06 s and 3.27 s on earlier kits, about the variation between runs. The computer opens as quickly as before the tunnels (0.94 s and 1.05 s on kit 0.10). An earlier run with a game running stalled for over 2 s at a time, so the check needs the computer otherwise idle. Chrome's Task Manager has not been read on this kit.

### Checks on the tunnels (kit 0.11.3)

Barney looked on his Pixel: the portal, the inside and the exit look the same as the design system's version 12 boards; he could not see the loop's jump in scene 12; the rain's fade sounds right. In the app's own browser: the build's font and character checks pass (123 characters); the strips are continuous and the lane signals steady, as there is nothing in them that changes. Calling the loop, and keeping bays, power-ups, obstacles, animals and passengers out of the clear stretches and the tunnels, are left to the game.

### Results, 31 October 2026 (kit 0.12.0, the bays, Chrome 156)

The Pixel in full screen with its screen at 120 Hz, from the copy of the test page without the soundtracks. The computer was not run on this kit.

| | Pixel 11 Pro XL, kit 0.12.0 | Pixel, kit 0.11.3 |
|---|---|---|
| **Bay drive (scene 14): a minute at 70 km/h with traffic and bays coming and going** | **120 fps, slowest 1 frame in 20 came 9 ms apart, the slowest of all 12 ms** | no such scene |
| Street alone, with a crash pop | 120 fps, about 3.1 ms, each | 120 fps, about 3.1 ms, each |
| With street pieces, with the whole play screen | 120 fps, about 3.2 ms, each | 120 fps, about 3.1 and 3.2 ms |
| Slowest 1 frame in 20 came | 9 ms apart | 9 ms apart |
| Zone change's cross-fade | 120 fps, slowest frame 11 ms | 120 fps, slowest frame 9 ms |
| Slowest frame of the whole zone change | 11 ms | 10 ms |
| Through a tunnel | 120 fps, about 2.1 ms, slowest frame 12 ms | 120 fps, about 2.1 ms, slowest frame 20 ms |
| The loop's jump | slowest frame 9 ms | slowest frame 10 ms |
| Crash pop words drawn | 116 ms, 1329 × 861 each | 156 ms, 1329 × 861 each |
| Picture | 1803 × 810, 4× smoothing | 1803 × 810, 4× smoothing |
| Targets | pass | pass |
| Building the street when the page opens | 3.48 s (planning it 67 ms, its first pieces 21 ms) | 3.17 s (planning it 61 ms, its first pieces 19 ms) |
| Start game worked, and the first picture | 3.71 s after opening | 3.36 s after opening |
| Graphics memory in all (the kit's count) | 260 MB in the speed check, 262 MB in Bay drive: street shapes 2.3 and 3.6, other buffers 0.4, textures 190 and 191, picture buffers 67 | 260 MB: street shapes 2.6, other buffers 0.4, textures 190, picture buffers 67 |

The bays cost no speed that shows: the slowest frame in a minute of them came 12 ms apart, against 8.3 ms for one refresh of the screen. The four new upright pictures fitted on the atlas's existing pages, so textures barely move. Opening, at 3.71 s, is the slowest so far (3.06 to 3.36 s on earlier kits). That is one run, so it can't say whether the bays' pictures or the variation between runs account for it. Chrome's Task Manager was not read on this kit.

### Checks on the bays (kit 0.12.0)

In the app's own browser, at phone sizes, with made-up touches: at 35 m only the pin shows; from about 20 m the sign and posts show, over the taxi's roof from the bay's lane; at 12 m 上客 and 落客 read well, PICK-UP and DROP-OFF are small; the pin's tag stays clear of the sign; the bold edges and bars are clean with the taxi in the bay; two pick-ups and two drop-offs ran through the real game. The hint fits on one line at 740 × 360 and goes at the first touch. All 14 scenes and the speed check ran with no errors, and the build's font and character checks pass. Barney played the side rule on his Pixel (it works well) and approved the first pictures of the bay. He compared it side by side with the design system's version 13 work and is happy with it.

**Known differences:**
- A street lamp can stand in front of the sign, depending on where a bay falls: in scene 13's "under a street lamp" stills at 20 m its pole part-hides the sign's first character.
- People on the pavement can overlap the sign. Whether someone nearer is always drawn in front of it was not checked.
- The sign's legs and the posts' dark bodies are at the signs' level of grain, because they share pictures with their lights (the handover accepts this). No difference shows in the app's pictures; Barney's screen is the better test.

### Checks before handing back (kit 0.10.2)

Checked in the app's own browser, with the page's sound silenced:

- **The speed check** runs all four runs and the zone change, and puts the meter and the taxi back afterwards. The app's browser is too slow to give real numbers: the results to come are from the computer and the Pixel.
- **The music**: pause keeps the place (it came back 25.8 s in), a new game starts the first track from the top, game over fades it out, and it changes track at a zone change. The two modes belong to the game.
- **A shielded hit**: the SAFE! sign and no crash pop; the taxi drives on. Lives and the tip belong to the game.
- **Touch**: a touch outside the zones does nothing, and the tiles still work with the zones on.
- **Reduce motion**: all four Moments run with it on, without errors. Barney looked at it on the test page: fine.
- **The fonts** in `kit\fonts\` are the design system's, and the build's font and character checks pass (122 characters).

Barney compared each piece side by side with the design system's previews and the canvas row: good.

## The stop bays (kit 0.12)

The bay was redrawn to stand out on a phone (design system v13, `design-system/components/StopZone`): bold paint with no words on the road, a low lit sign at its start and three lit posts along its far half. The drawing code is copied word for word from the design system's `bundle.js`; the paint is drawn in 160 rows so its diagonal bars stay straight close to the camera. Two things are the kit's own, added at Barney's wish or to make the first work: a bay the game replaces with one further on stays until the taxi has passed it, so its sign and posts don't vanish in full view, and `street.stop = null` clears a bay at once. Nothing else in the kit's API changes.

## The tunnels (kit 0.11)

夜光隧道 Nightglow Tunnel stands at every district line (design system v12, `design-system/components/Tunnel`), 180 m long with the line in its middle.

- **The street round it**: the road runs straight from 40 m before each portal to the exit, so all four tunnels are the same (Barney's choice, 30 October 2026; a bend reaching that stretch is left out whole). That 40 m is the clear stretch: no hanging signs, cables or side streets. Nothing of the street's is inside, and nobody walks in it or within 30 m of it. A game keeps its bays, power-ups, obstacles, animals and passengers out of both.
- **The inside** is made from the place in the tunnel, not along the street: walls, ceiling, road, walkways and two continuous light strips. The far end is lost in `tunnel-haze` by about 80 m; the exit's light spills over the last 16 m. The taxi and the traffic are lit about half as bright inside, changing over about a second as a mouth fills the view, and the rain drops to a fifth (Barney's choice).
- **The jumps**: a zone starts at `street.districts[i].start`, 20 m before the exit of the tunnel at the district's start (a starting figure). `street.loop()`, called in the update where the taxi crosses the line at the end of its zone, takes the taxi and the traffic back one district, so it comes out at the start of the same district. Compared pixel by pixel in the app's browser, the picture differs by 0.1 to 0.6 out of 255 on average across the jump, close to the shimmer between two frames in one place.
- **Known differences**: the signs and lane signals on the portal's face share the buildings' grain, because they are one picture (the handover accepts this). 健康藥房's neon on the face has no pale core: the design system's code asks for `tube-core-green`, which is not among its tokens. It is copied as it is.

## The long street (kit 0.7)

Each district is 3.7 km long (`district-length`), so the street is 14.8 km, long enough for a whole zone of Grunge City Rider. It used to be 560 m. Each district keeps its look: its buildings, shop fronts, signs and people are picked the same way as before, and the first 560 m bend as the old street did. The last bend that would not fit before the lap's end is left out, so the street meets its start straight (kit 0.10.2; it used to stop at full strength on the line from Mong Kok into Tsim Sha Tsui, a sudden shift in the road).

Made whole, as the old street was, a 14.8 km street would need about 275 MB of the graphics chip just for its shapes, against 10.6 MB for the old one. So the kit plans the whole street when it opens, which is quick, and makes its shapes a piece at a time (25 m to a piece) as the taxi drives. Eight pieces are kept on the graphics chip, the stretch from the camera on: at most about 5 MB. The next piece ahead is made a millisecond a frame. A piece the picture needs at once, at the start or after a jump (a district's start, or the test page's N), is made there and then: a brief pause, which the zone-change title will cover in the game. People walk only near the camera, each within 30 m of where it started.

In the app's own browser on Barney's computer (not Chrome; a rough guide only): building the street when the page opens took 784 ms against 775 ms for kit 0.6.1. Planning the 14.8 km street takes about 60 ms; making the first pieces about 20 ms, where the old street's shapes took about 100 ms. Each piece takes under 1 ms to make on that computer. The real measures are Barney's: the Pixel's are in the speed check's results above, and the computer's are still to come.

## Sound (kit 0.10)

- **The shell's sounds** are Retro Kit's set, made in code. A game's own sounds (Grunge City Rider's horn, the crash, a fare paid and so on) are made with `cn.sfx.tone` and `cn.sfx.noise`.
- **The engine**: a steady note made in code that rises with the taxi's speed, during a run only.
- **Crashes and animals**, made in code, for a game to play: `cn.sfx.crash('vehicle')` (a heavy thump, metal crunching and ringing, glass falling, bits landing), `cn.sfx.crash('obstacle')` (a hollow plastic thock and a crack, then barriers and cones bouncing away) and `cn.sfx.animal('boar')`, `'dog'`, `'cat'` or `'chickens'` as an animal bolts. Scene 4 plays the crashes, scene 9 the roadworks one, scene 6 the animals.
- **The city sound bed**, made in code: rain (noise only: a soft wash with thousands of tiny ticks of noise in it, and heavier pats on a loop of another length), a low traffic rumble that swells and falls, and now and then a horn far off to one side. It plays under the title and in play, at half loudness behind a panel. Its loudness against the music is 0.5, Barney's choice by ear on the test page (scene -, Sound).
- **Soundtracks**: a game gives one (`music: { data }`) or two, each for its districts (`music: [{ data, districts: [0, 1] }, { data, districts: [2, 3] }]`). When the street moves to the other track's districts, the old one fades (over 2 s as the taxi crosses the line, 1.5 s under a zone change's title) and the new one starts from its beginning; pause keeps the place, a new game starts the first track from the top, game over fades out. Both are decoded behind the title screen (about 120 MB of memory for Grunge City Rider's two). Both tracks open very quietly and reach full level after 20 to 30 seconds. They play at 0.525 of the file's full level against the sound effects (Barney, 30 October: Retro Kit's 0.35, 50% louder); a game can give its own with `level`.
- **The soundtrack files**: a game's own `music.js` beside its `index.html`, or a file in `music\` that more than one page shares. `music\grunge-city-rider.js` holds Grunge City Rider's two tracks, *Midnight Fare Dash* and *Meter Running High*, as text; the game and the test page both copy it in, so each built file is about 10.8 MB larger.

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
| `kit\city-nights.js` | The kit: the street and everything on it, the game shell, sound, saving, the Picture setting. The crash pop's drawings, the street's pieces, the play screen's parts (`CityNights.hud`: lives, lamps, the caption, the pin, badges and rings, the receipt slip, the SAFE! sign, the zone title, the touch zones) and the code that draws them are copied unchanged from the design system (`design-system\components\bundle.js`) |
| `kit\build.py` | Turns a game's source into one playable file, and checks it against the rules |
| `kit\template.html` | Starting point for a new game |
| `kit\fonts\`, `kit\licences\` | The six font files and their licences (SIL Open Font License: free to embed in games); Bangers is for the crash pop's letters and the SAFE! sign's word only. `fonts\characters.txt` lists the Chinese characters the fonts hold, for the build's check |
| `music\grunge-city-rider.js` | Grunge City Rider's two soundtracks, as text, shared by the game and the test page |
| `games\cn-sampler\` | The test page |
| `games\cn-empty\` | The template as a game, to prove the template builds |
| `..\dist\<name>.html` | The built games, shared with Retro Kit's (not kept in git) |

Settings are saved in the browser on each device and shared with every game in the arcade (volume, effects, reduce motion); Picture is City Nights' own. High scores are kept per game in the arcade's format, the fare in whole cents, where the website will find them.
