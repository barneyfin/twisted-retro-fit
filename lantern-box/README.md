# Lantern Box

The arcade's third style kit: backlit cut-out silhouettes in layered, coloured air, like a paper theatre lit from behind. Its games are side-on, on one plane. The pilot game is Gloam Hallow, in phase 4.

`ARCADE.md` holds the rules for the whole arcade, `design-system/` is this kit's spec, and `HANDOVER.md` is the state of the work.

## Play a game

Open `dist/<name>.html` in the Retro Games folder by double-clicking it. Each is one file that works offline. They are made by the build, and are not kept in git.

- `dist/lb-sampler.html`: the test page.
- `dist/lb-empty.html`: the empty game. The arrow keys walk, Space or a tap earns wisps for health, and X or a second finger ends the run.

## Build

In PowerShell, one command:

```powershell
& "C:\Users\barne\AppData\Local\Programs\Python\Python312\python.exe" "C:\Users\barne\Documents\Calude Code\Retro Games\lantern-box\kit\build.py"
```

It prints a line for each game, then `Done, no warnings.` Add a game's folder name to the end to build just that one. A game is finished only when it builds with no warnings.

## Make a new game

1. Copy `kit/template.html` to `games/<name>/index.html`. The folder name must not be used by a game in another kit, because every kit builds into `dist/`.
2. Fill in `id` and `title`. A name goes on two short lines, about 9 letters each at most, or it won't fit the arch.
3. Write `start`, `update` and `draw`. Everything the kit offers is listed in `kit/lantern-box.js` under "Public API".
4. Name colours with `lb.color('ember')`, never as colour codes. The names are in `design-system/tokens.json`.
5. A soundtrack goes in a `music.js` beside `index.html`, one or two tracks. The game switches with `lb.music(1)`.

A frame of the World looks like this. The game decides what happens, and the tools only draw:

```js
lb.world.begin(ctx, { place: 'night', camX: g.x - lb.W * 0.3, rise: g.rise });
lb.world.monster({ kind: 'crawler', x: 900, ph: 1.3, id: 'crawler-1' });
lb.world.wanderer(g.x, { walking: g.walking, facing: g.facing });
lb.world.end();
```

Each place is already seen from a little above the path (its lift, set in the design system), so the back layers stay apart on a phone; `rise` lifts the camera further, for example to follow a jump.

The path's scenery is the directions page's sample strip until levels are laid out (step 4a). Monsters have their existing poses and face one way until Gloam Hallow's play parts are designed (step 4b).

## The test page

`dist/lb-sampler.html`. Start game, then:

| Button | Key | What it does |
|---|---|---|
| Place | 1 2 3 4 | The next place, or a place by number |
| Walk | arrows | Walks on its own, or by the left and right arrows |
| Rise | up and down arrows | Raises and lowers the camera, up to half a picture |
| Crowd | C | Eight monsters and the place's boss, on or off |
| Defeat | D | Breaks the crowd and the boss into card pieces and wisps |
| Hurt | | Lowers the health and mana bars |
| Parts | V | Each drawing part in turn: the place alone, the monsters, defeats, the boss, the wanderer, the splash, the lights |
| Screens | | Opens any screen: pause, settings, three kinds of game over, initials, high scores, the rotate notice, the title |
| Speed check | T | Runs the speed check |

The readout at the top shows frames a second, the processor's time for a frame, the picture's size and sharpness, the Picture level in use, the memory the layers take, and what you're looking at. Effects, Reduce motion and Picture are in Settings, from the pause tile.

## The speed check

Open the test page in Chrome with no other copy open, choose Start game, tap Speed check, and leave it alone for about half a minute. It runs each place in turn with eight monsters, the boss, the flyers, the rain and the camera rising, as phase 1's speed test did. It ends with a table, pass or fail against both targets, and a line to copy.

- Phone: at least 30 frames a second, with each frame drawn in 25 ms or less.
- Computer: 60 frames a second.

Published copy (private to Barney): https://claude.ai/artifact/4U9Mbj734kYaNjFyFeY1ay

### Results, 2 November 2026 (kit 0.4.0, Picture Automatic, which stayed at Best)

| Device | Picture | Night | Blood-red rain | Dawn | Mist | Slowest 5% / longest | Layers |
|---|---|---|---|---|---|---|---|
| Pixel 11 Pro XL, Chrome 156 (PowerVR) | 1972 × 886 at 1.64× | 79 fps / 12.5 ms | 58 / 14.8 ms | 83 / 12.3 ms | 74 / 13.1 ms | 25 / 26 ms | 107 MB |
| Computer, Chrome 156 on Windows, RTX 5080 | 3004 × 1440 at 2.67× | 60 fps / under 2.1 ms | 60 / under 2.1 ms | 60 / under 2.1 ms | 60 / under 2.1 ms | 17 / 17 ms | 231 MB |

Each cell is frames a second / time to draw one frame. Both pass their targets, in every place. "Under" means eight frames fitted inside one screen refresh, so the time is an upper limit. The Pixel reports its system as Android 10 to web pages, whatever it really runs. The iPhone, the HP laptop, the Fire HD 8 and the computer's AMD graphics are still to be measured (report only). The results from phase 1's speed test are in `speed-test/README.md`.

### Results, 3 November 2026 (kit 0.6.0: the new bosses and graded monsters, Picture Automatic, which stayed at Best)

| Device | Picture | Night | Blood-red rain | Dawn | Mist | Slowest 5% / longest | Layers |
|---|---|---|---|---|---|---|---|
| Pixel 11 Pro XL, Chrome 156 (PowerVR) | 1972 × 886 at 1.64× | 74 fps / 10.5 ms | 54 / 13.1 ms | 72 / 10.4 ms | 64 / 11.6 ms | 25 / 33 ms | 107 MB |

The phone still passes in every place. Against kit 0.4.0, each place lost 4 to 11 frames a second (Dawn and Mist the most, where the new bosses are heavier), the time to draw a frame is no worse, the slowest 5% is unchanged and the single longest frame rose from 26 to 33 ms. The computer was not measured again.

## Picture: Automatic, Best, Faster, Fastest

| Level | What it does |
|---|---|
| Best | The device's full sharpness, up to 2×, and never more than 1440 lines tall |
| Faster | One picture pixel per screen point, and never more than 810 lines tall |
| Fastest | As Faster, with the glows off whatever the Effects setting says |
| Automatic | Starts at Best and times the first seconds of play. While frames come more than 25 ms apart on average it steps down a level and times again |

Automatic runs once each time the page is opened, only during play, and never steps back up. Each step causes a brief hitch while the pictures are repainted.

## Effects

Off leaves out the glow round lights, ember eyes, splashes and wisps. A monster's or a boss's rim is made of blur, so with Effects off it becomes a thin hard ember line, which keeps black monsters readable against black scenery. The sky, moon, sun, mist, the layers' haze, lightning and the dark edges don't change.

## What's where

| Path | What it is |
|---|---|
| `HANDOVER.md` | The note that hands the kit from phase to phase |
| `HANDOVER-bosses.md` | The note that handed over design system version 6: the new bosses and graded monsters |
| `design-system/` | The copy of the approved design system, the spec. Don't edit it here |
| `speed-test/` | Phase 1's speed test, kept as it is |
| `kit/lantern-box.css` | The design system's tokens and Interface, unchanged, and the shell's layout |
| `kit/lantern-box.js` | The game shell, and the World's drawing code with its tools |
| `kit/build.py` | Makes `dist/<name>.html` and checks the rules |
| `kit/template.html` | The starting point for a new game |
| `kit/fonts/`, `kit/licences/` | IM Fell English and Alegreya Sans, and their licences |
| `games/lb-sampler/` | The test page |
| `games/lb-empty/` | A copy of the template, kept to prove a new game builds with no warnings |

The drawing code in `kit/lantern-box.js` is the design system's `components/bundle.js` word for word, apart from the speed test's switches and the Effects switch (`FX`). Change the look in the design system first.
