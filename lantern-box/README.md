# Lantern Box

The arcade's third style kit: backlit cut-out silhouettes in layered, coloured air, like a paper theatre lit from behind. Its games are side-on, on one plane. The pilot game is Gloam Hallow, in phase 4.

`ARCADE.md` holds the rules for the whole arcade, `design-system/` is this kit's spec, and `HANDOVER.md` is the state of the work.

## Play a game

Open `dist/<name>.html` in the Retro Games folder by double-clicking it. Each is one file that works offline. They are made by the build, and are not kept in git.

- `dist/lb-sampler.html`: the test page.
- `dist/lb-empty.html`: the empty game. The arrow keys or A and D (or the stick on a touch device) walk along Night's level, J (or the attack button) earns wisps for health, and K (or the cast button) ends the run.

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
6. Sounds come from the kit: `lb.sfx('swing')` plays one of the design system's sounds (`lb.sounds` lists them), and `lb.ambient('night')` sets the place's background sound, heard only in play. The kit plays the menus' sounds, the plaque lines' chime, the place card's toll and the win's bells itself. A game carries no sound files of its own.

A frame of the World looks like this. The game decides what happens, and the tools only draw:

```js
const L = lb.world.level('night');                       // the place's level: its rolling ground, banks, pits and pieces
lb.world.begin(ctx, { level: L, camX: g.x - lb.W * 0.32 });
lb.world.monster({ kind: 'crawler', x: 900, ph: 1.3, id: 'crawler-1', attack: g.lunge });
lb.world.wanderer(g.x, { move: g.move, step: g.step, facing: g.facing });
lb.world.end();
```

Each place is already seen from a little above the path (its lift, set in the design system), so the back layers stay apart on a phone; on a level the camera rises with the ground where the wanderer is held, and `rise` can lift it further.

Since kit 0.8 (design system version 8, step 4c) the tools draw Gloam Hallow's play parts: each place's level, the wanderer's moves, the spells, loot and checkpoints, the posable monsters and their attacks, and the bosses' arrivals and attacks. The shell has the full HUD (`hud: 'full'`), How to play, the win, the place card, the touch controls and the named controls, and the design system's sounds. The tools draw and play; the game decides what happens. Without a level, the path is the directions page's sample strip. Monsters face left, as the design system draws them.

## The test page

`dist/lb-sampler.html`. Start game, then:

| Button | Key | What it does |
|---|---|---|
| Place | 1 2 3 4 | The next place, or a place by number |
| Ground | G | The place's whole level (its rolling ground, banks, pits and pieces, the camera rising with it; the default), or the flat strip |
| Section | N | On a level: on to the next hill section, then the boss's arena, then back to the start |
| Walk | arrows | Walks on its own, or by the left and right arrows |
| Rise | up and down arrows | On the flat strip: raises and lowers the camera, up to half a picture (a level rises with its ground) |
| Crowd | C | Eight monsters and the place's boss, on or off |
| Defeat | D | Breaks the crowd and the boss into card pieces and wisps |
| Hurt | | Lowers the health and mana bars |
| (the wanderer) | Space, J, K, Shift, L | Since 4c-6b the kit's named controls play his moves: Space jumps, J swings the sword, K casts the chosen spell (heal, fireball, or a fizzle with none), Shift rolls, L switches spell. On a touch device the stick walks (a quick flick sideways rolls, up climbs) and the three buttons jump, swing and cast; Hide clears the test buttons away (from the thumbs on a touch device, and from the ground on any), and the Test buttons button brings them back. The readout names the last control pressed |
| Sounds | | Plays any of the kit's sounds (since 4c-7), and turns the place's background sound on or off. The wanderer's moves make their sounds, the plaque lines chime, the place card tolls and the win rings its bells; the background follows the place shown, in play only, and is off during the speed check |
| HUD | | Plays the HUD's moments (since 4c-6a, the full HUD of design system version 8): an armour pip filling or cracking, a life's lantern guttering out, learning and switching spells, mana short of the spell's cost, plaque lines (two take turns), a boss fight (its name, the bar filling, hits with their traces, the bar going) and the place card. A tap on the spell's socket switches spells too |
| Parts | V | Each drawing part in turn: the place alone, the monsters, defeats, the boss, the wanderer walking and standing, his moves (jump, sword, roll, fireball, hurt, the life lost), the boss (arriving, its three attacks with their signals and ground warnings, a hit), the monsters' attacks (each signals, attacks, recovers and takes a hit), casting, the sword's six looks, the spells (heal at three strengths, not enough mana, fireballs and their bursts), the loot (resting, dropping, picked up), the checkpoint (lighting, and the return after a life lost), climbing the place's first bank, walking off the crag and falling into the place's first pit (on a level), the splash, the lights |
| Screens | | Opens any screen: pause, settings, three kinds of game over, initials, high scores, How to play (from play and from the title), the win (three lives, one life), the rotate notice, the title |
| Speed check | T | Runs the speed check |

The readout (under the HUD, and out of the way while a plaque line, the boss's name or the place card shows) shows frames a second, the processor's time for a frame, the picture's size and sharpness, the Picture level in use, the memory the layers take, and what you're looking at (on a level, which section and how far along). Effects, Reduce motion and Picture are in Settings, from the pause tile. The test page's buttons step aside while the boss bar or the place card shows.

## The speed check

Open the test page in Chrome with no other copy open, choose Start game, tap Speed check, and leave it alone for about half a minute. It runs each place in turn with eight monsters, the boss, the flyers and the rain, as phase 1's speed test did. Since kit 0.8.0 it walks up each place's big hill (section E) on its level, the camera rising with the ground, so its results are not quite comparable with earlier ones. It ends with a table, pass or fail against both targets, and a line to copy; since step 4c-4 the line names the step the test page was built for, so a cached copy shows. Since 4c-5b its crowd attacks about half the time and its boss fights, so it measures the heaviest case. Since 4c-8 a fifth leg follows the four: the Mist at its boss's arena (the Gaping Tree fighting, the crowd attacking, the boss bar showing), as the design system's speed target asks; the line says "up the big hill, then the Mist at its boss" and adds "Mist boss". The places' background sound is off during the check.

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

### Results, 3 November 2026 (kit 0.7.0: lighter blacks and the bosses' glow drawn onto the scene each frame)

| Device | Picture | Night | Blood-red rain | Dawn | Mist | Slowest 5% / longest | Layers |
|---|---|---|---|---|---|---|---|
| Pixel 11 Pro XL, Chrome 156 (PowerVR) | 1972 × 886 at 1.64× | 72 fps / 9.8 ms | 58 / 13.9 ms | 77 / 10.1 ms | 63 / 11.2 ms | 25 / 41 ms | 111 MB |

Within a few frames a second of kit 0.6.0 in every place (Dawn 5 better, Mist 1 worse), so the glow drawn every frame costs little. The slowest 5% is unchanged; the single longest frame was 41 ms. The computer was not measured again.

### Results, 4 November 2026 (kit 0.8.0: step 4c-1, the crows and leaves; step 4c-2, each place's level)

| Device | Picture | Run | Night | Blood Red Rain | Dawn | Mist | Mist at its boss | Slowest 5% / longest | Layers |
|---|---|---|---|---|---|---|---|---|---|
| Pixel 11 Pro XL, Chrome 156 (PowerVR) | 1972 × 886 at 1.64× | 4c-1, the flat strip | 80 fps / 12.8 ms | 58 / 14.8 ms | 73 / 13.5 ms | 70 / 13.7 ms | – | 25 / 27 ms | 107 MB |
| Pixel 11 Pro XL, Chrome 156 (PowerVR) | 1972 × 886 at 1.64× | 4c-2, up the big hill | 73 fps / 10.3 ms | 57 / 14.3 ms | 75 / 10.7 ms | 66 / 13.0 ms | – | 25 / 37 ms | 111 MB |
| Pixel 11 Pro XL, Chrome 156 (PowerVR) | 1972 × 886 at 1.64× | 4c-3, the wanderer, up the big hill | 74 fps / 10.4 ms | 57 / 14.1 ms | 78 / 11.2 ms | 66 / 13.1 ms | – | 25 / 33 ms | 111 MB |
| Pixel 11 Pro XL, Chrome 156 (PowerVR) | 1972 × 886 at 1.64× | 4c-4 test page, up the big hill | 76 fps / 9.9 ms | 60 / 13.5 ms | 83 / 10.3 ms | 71 / 11.6 ms | – | 24 / 26 ms | 111 MB |
| Pixel 11 Pro XL, Chrome 156 (PowerVR) | 1972 × 886 at 1.64× | 4c-5a, the posable monsters at rest, up the big hill | 76 fps / 10.4 ms | 61 / 13.6 ms | 79 / 10.5 ms | 69 / 12.5 ms | – | 25 / 28 ms | 111 MB |
| Pixel 11 Pro XL, Chrome 156 (PowerVR) | 1972 × 886 at 1.64× | 4c-5b, the crowd attacking and the boss fighting, up the big hill | 56 fps / 14.3 ms | 43 / 17.5 ms | 54 / 14.5 ms | 49 / 18.0 ms | – | 32 / 43 ms | 111 MB |
| Pixel 11 Pro XL, Chrome 156 (PowerVR) | 1972 × 886 at 1.64× | 4c-6a, the same with the full HUD on screen | 55 fps / 14.3 ms | 44 / 17.5 ms | 54 / 14.9 ms | 48 / 16.4 ms | – | 27 / 50 ms | 111 MB |
| Pixel 11 Pro XL, Chrome 156 (PowerVR) | 1972 × 886 at 1.64× | 4c-8, the finished kit (the controls and sound in), up the big hill, then the Mist at its boss | 56 fps / 14.5 ms | 45 / 18.7 ms | 55 / 15.6 ms | 45 / 16.3 ms | 48 / 17.4 ms | 32 / 36 ms | 118 MB |
| Computer, Chrome 156 on Windows, RTX 5080 | 2560 × 1440 at 2.67× | 4c-5b, the crowd attacking and the boss fighting, up the big hill | 60 fps / 2.5 ms | 60 / 2.6 ms | 60 / 2.5 ms | 60 / 3.1 ms | – | 17 / 21 ms | 208 MB |
| Computer, Chrome 156 on Windows, RTX 5080 | 2560 × 1440 at 2.67× | 4c-8, the finished kit, up the big hill, then the Mist at its boss | 60 fps / 2.6 ms | 60 / 2.6 ms | 60 / 2.4 ms | 60 / 3.3 ms | 60 / 3.0 ms | 17 / 18 ms | 214 MB |

Both pass in every place. 4c-1 drew frames 1 to 3 ms slower than kit 0.7.0, Night (which has bats, not crows) as much as the others, so it is likely run-to-run variation; its longest frame was shorter. 4c-2's speed check walks up each place's big hill on its level with the camera rising, so it is not quite comparable with the flat-strip runs; the levels cost about what the flat strip did. 4c-3's posable wanderer, painted once per pose step, made no difference that shows. The speed check's scene does not include 4c-4's spells, loot and checkpoints (they are on screen only for moments in play); its run is within run-to-run variation of 4c-3's. 4c-5a's crowd is the posable monsters, at rest (painted once per pose step): no difference that shows. From 4c-5b the speed check's crowd attacks about half the time and its boss fights, the heaviest case: the Pixel still passes in every place (frames drawn in 14 to 18 ms, at least 43 fps), with about 7 ms of headroom where there were about 12, and the slowest 5% of frames now 32 ms. Each attacking monster is repainted every frame with its rim; if later steps bring the phone close to its limit, repainting an attacking monster at most 30 times a second would roughly halve that cost. The computer was not measured again. 4c-6a puts version 8's full HUD on screen during the run: the Pixel's results are within run-to-run variation of 4c-5b's (its slowest 5% a little better, its single longest frame a little longer), so the HUD costs nothing that shows. 4c-8 is the finished kit, with the controls and sound in it (the background sound is off during the check), and adds the fifth leg, the Mist at its boss: the Pixel passes in every leg (frames drawn in 14.5 to 18.7 ms, at least 45 fps; at the Gaping Tree with the crowd, 48 fps and 17.4 ms), within run-to-run variation of 4c-5b and 4c-6a. The computer holds 60 fps in every leg, frames drawn in 2.4 to 3.3 ms.

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
| `HANDOVER-bosses-7.md` | The note that handed over design system version 7: lighter blacks and a stronger glow, to show on a phone |
| `design-system/` | The copy of the approved design system, the spec. Don't edit it here |
| `speed-test/` | Phase 1's speed test, kept as it is |
| `kit/lantern-box.css` | The design system's tokens and Interface, unchanged, and the shell's layout |
| `kit/lantern-box.js` | The game shell, and the World's drawing code with its tools |
| `kit/build.py` | Makes `dist/<name>.html` and checks the rules |
| `kit/template.html` | The starting point for a new game |
| `kit/fonts/`, `kit/licences/` | IM Fell English and Alegreya Sans, and their licences; the source and licence of the kit's two recorded sounds |
| `games/lb-sampler/` | The test page |
| `games/lb-empty/` | A copy of the template, kept to prove a new game builds with no warnings |

The drawing code in `kit/lantern-box.js` is the design system's `components/bundle.js` word for word, apart from the speed test's switches and the Effects switch (`FX`). Change the look in the design system first.
