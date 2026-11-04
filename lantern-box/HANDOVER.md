# Lantern Box: handover for phase 3

This note hands the Lantern Box kit to Claude Code for phase 3, the code kit and test page. Phases 1 and 2 were done in Barney's Claude app project, *Browser Arcade*, where the design work stays. Read this whole note before writing any code. Written 1 November 2026.

## What Lantern Box is

The arcade's third style kit: backlit cut-out silhouettes in layered, coloured air, like a paper theatre or a bat light box lit from behind. Black card scenery, monsters and a hooded wanderer stand against four coloured skies; small lights glow gold, danger glows ember, and a few menacing things at ground level are lit witch-green. Games are side-on, on one plane: hack and slash, platformers, runners, side-scrolling shooters. The pilot game is **Gloam Hallow**, a dark-fantasy hack and slash (phase 4).

It is **neither Retro Kit nor City Nights**. Do not use the `retro-kit` skill or Retro Kit's look (glass panels, Geist, banded shape art), and do not use City Nights' look. ARCADE.md's arcade-wide rules apply in full; the other kits' own rules do not. Lantern Box copies Retro Kit's game shell and build and restyles them (PRD question 2), with City Nights' automatic detail setting brought across.

## Read first, in this order

1. `ARCADE.md` (repo root): the rules for every kit and game.
2. This note.
3. `lantern-box/design-system/README.md`: the kit's rulebook. With it: `tokens.json` and `tokens.css` (every named colour, type style, size and picture number), `components/*/README.md` (one per part) and `components/bundle.css` (the Interface already written as CSS; most of the kit's stylesheet starts here). See `ABOUT-THIS-COPY.md` there.
4. `lantern-box/design-system/components/bundle.js`: the World's drawing code, the round 12 directions page copied unchanged, with `LanternBox.world` at the end.
5. `lantern-box/speed-test/README.md` and `src/`: the speed test that passed. `src/kit.js` and the patches in `build.py` are the kit's way of drawing: they become the start of the drawing tools.
6. `kit/retro-kit.js`, `kit/retro-kit.css`, `kit/build.py`, `kit/template.html`: Retro Kit's shell and build, which Lantern Box copies and restyles. And `city-nights/kit/city-nights.js` for the automatic detail (Picture) setting. Read them; never change them.

## Where things are

- The approved design system (the spec): https://claude.ai/artifact/WHorELA7gRgEncv7E7vvEY. The copy in `lantern-box/design-system/` is version 8 of it (version 1 plus the layer lift and contrast, the moor's houses, its stone circles and the buildings' doors below, the new bosses and graded monsters in `HANDOVER-bosses.md`, version 7's lighter blacks and stronger glow in `HANDOVER-bosses-7.md`, and the play parts of version 8 in `HANDOVER-play-8.md`).
- The PRD (approved): https://claude.ai/artifact/HrT3en8qzkZG6v6kZxkPcJ
- The screens rounds, the mock-ups behind the design system: https://claude.ai/artifact/J2qPyKBtp9xn2v6qDXLVdA
- The approved look (round 12 directions page): https://claude.ai/artifact/NUbeSksdSun3oMFkVkEcbo. Its source is `lantern-box/speed-test/src/directions-round12.html`.
- The speed test (published copy): https://claude.ai/artifact/9QdUjWZGR9XCEpYkyVQika
- These links open for Barney; you may not be able to read them. Everything phase 3 needs from them is in this repo or below.

## Decided (all Barney's, 1 November 2026)

**Look and layers**
- Two layers. **World**: the scene drawn on the 2D canvas into a 540-line picture that fills the window, as a paper theatre: the sky and its light, clouds, four backdrop layers, flyers, the play strip, the fore layer, the vignette. **Interface**: everything a player reads or presses, as HTML over the picture.
- **Brass plaques** (dark chamfered panels with a thin brass edge) for every screen and the HUD. **The lancet arch** (a gothic arch cut from black card, lit from behind) for the title screen only.
- The look is round 12 of the directions page, as `bundle.js` draws it: Scene version 5, splashes on at the intense glow, card-and-wisp defeats. The canvas HUD the directions page drew (`drawHUD`, "SOULS") was a sketch and is not used: the HUD is HTML.
- Four places, one per level: Night (the graveyard at the edge of the village), Blood-red rain (the old town), Dawn (the open moor), Mist (the wind-bent forest).
- The camera rises with the wanderer onto ledges and rooftops (PRD question 5); each layer rises by its parallax, and the overhanging branches stay pinned to the top edge. The speed test's rise of up to half a picture is a starting figure; the real height comes with the levels in 4a.

**Drawing**
- The 2D canvas, layers painted once in tiles and slid, poses painted once per puppet step (PRD question 3, proved by the speed test). No WebGL.
- Port the drawing code from `bundle.js` word for word; the kit's way (tiles, poses, sprites) changes when things are drawn, never what they look like.
- No outside libraries, no image files.

**The HUD and the score**
- Health and mana in one plaque top left; the full-screen tile (computers only), the pause tile and the wisps counter top right. See Vitals, HudTile, WispCounter and PlayScreen.
- **The score is counted in wisps**, a whole number. The HUD counter and the title's Best are padded to four places with zeros (`0450`); game over, the initials line and the high-score table are not.
- Numbers are Alegreya Sans bold with tabular figures, never IM Fell English (its old-style figures read 1120 as "II2O").

**Screens**
- Title (the arch: Start game, High scores, Settings; Best; arch tiles for sound and full screen), pause, settings, game over, initials, high scores, the rotate notice, each with a computer layout and a phone layout (a phone held sideways, 844 × 390 points). The components give every size.
- Game over follows the shared shell: if the score makes the top ten, the only button is Continue, which leads to the initials and then the high scores; otherwise Play again, High scores and Menu. NEW BEST shows only when the score beats the best on this device. The initials plaque is headed "New best", as drawn (and as City Nights).
- No modes screen until a game has modes. Keyboard hints on computers only; on a phone, menus are tapped. Touch controls for play are designed with Gloam Hallow's play screen in step 4b, so the shell has none yet.
- Keycap arrows are drawn as small strokes (the kit's Alegreya Sans has ↑ and ↓ but not ← and →).

**Settings** (shared across the arcade)
- Rows, in order: Volume, Effects ("Glow round lights, eyes and splashes."), Reduce motion ("Flatter scenery, slower rain, no shaking."), Picture (Automatic, Best, Faster, Fastest; Automatic by default). No Solid panels row: plaques are already near solid.
- Shared settings live in Retro Kit's `retrokit.settings` object (`volume`, `muted`, `effects`, `reduceMotion`, `solid`). Lantern Box reads and writes the ones it shows and leaves `solid` as it finds it. Picture is Lantern Box's own, in `lanternbox.settings`, as City Nights uses `citynights.settings` (Barney, 2 November 2026).
- Reduce motion: the drawing code already takes it (`rm`): backdrop layers at 0.4 of their parallax and the fore layer at 1.08, slower rain, clouds, mist and flyers, smooth half-speed puppet poses, no splash flicker. Never shake the screen with it on.
- Effects: built in 3c (`FX` in `lantern-box.js`). Off draws lights, ember eyes and rims, splashes and wisps without their glow (no shadow blur, no halo gradients). A monster's or boss's rim is made of blur, so with Effects off it becomes a thin hard ember line; the sky, moon, sun, mist, layer haze, lightning and vignette do not change. Shown to Barney in 3c.
- Picture (Barney, 2 November 2026): Best at the device's sharpness, up to 2× and 1440 lines; Faster at ordinary sharpness, up to 810 lines; Fastest the same with Effects' glows off; Automatic times the first seconds of play and steps down a level while frames take longer than 25 ms.

**Scores**
- High scores per game in Retro Kit's format: a top-ten array of `{"s": <number>, "i": "<initials>"}`, `s` the wisps. Saved under `retrokit.scores.<game id>`, as City Nights does, where the arcade website looks (Gloam Hallow's id `gloam-hallow`; Barney, 2 November 2026).

**Fonts**
- Use the files in `lantern-box/design-system/fonts/` (Fontsource's Latin cuts, 5.3.0: IM Fell English Regular; Alegreya Sans Regular, Medium and Bold) and their licences. Embed them in every game with the licences. Never link a font service from a game.

## Phase 3: the steps

Each step ends with a check-in: tell Barney what you built, what you checked, what you could not check, and write a commit message for it (below). He reviews before the next step, and you commit when he says yes.

- **3a. Skeleton.** `lantern-box/kit/` with the fonts and licences, `build.py` (copied from Retro Kit's and adapted: one offline file per game in `dist/`, fonts embedded, rule checks), `template.html`, and an empty game that builds. Build checks: no network requests, no image files, no colour codes in games (named colours only), the photosensitivity limits where they can be checked.
- **3b. The shell.** `lantern-box.js` and `lantern-box.css`, copied from Retro Kit's shell and restyled to the design system: title (the arch, the menu, Best, the arch tiles, key hints), pause, settings, game over (with the Continue rule above), initials (the phone's tap-a-letter layout too), high scores (two columns of five on a phone), the rotate notice, sound effects (Retro Kit's set), saving, full screen (filling the frame where full screen is refused, as the speed test does inside the Claude app). Over a plain dark backdrop for now.
- **3c. The drawing tools.** The speed test's way of drawing (`speed-test/src/kit.js` and the patches in `speed-test/build.py`) applied to the drawing code from `bundle.js`, as tools a game calls: a place drawn for a camera position and rise; the wanderer (a stand-in until 4b); monsters with their poses and the card-and-wisp defeat; bosses with their defeat; splashes; lights; flyers; rain, mist and lightning; the Effects switch. The tools draw; games decide what happens.
- **3d. Test page and finish.** `lantern-box/games/lb-sampler/`: every drawing part and every screen, with the frame-rate readout; the automatic Picture setting; Barney's speed check; `lantern-box/README.md`.

**Phase 3 ends when** the test page matches the design system, the speed still passes on Barney's computer and Pixel (at least 30 fps with frames drawn in 25 ms or less on the phone, 60 fps on the computer, in Chrome, in the slowest place with a crowd on screen: eight monsters, a boss, flyers and rain), and the build gives no warnings and the console is clean.

**Phase 3 is finished: Barney signed it off on 2 November 2026.** The speed passes on both devices (`README.md`, The speed check). The test page's copy is at https://claude.ai/artifact/4U9Mbj734kYaNjFyFeY1ay. He also checked these on the Pixel and all are fine: tapping the initials, turning the phone, full screen, any stutter when a place first appears, and how the lightning and the sound effects feel.

## Folder layout (from the PRD)

```
lantern-box/
  HANDOVER.md        this note
  README.md          how to play, build and add a game (3d)
  design-system/     copy of the approved design system
  speed-test/        phase 1, kept as it is
  kit/               lantern-box.css, lantern-box.js, build.py, template.html, fonts/, licences/
  games/lb-sampler/  the test page
dist/                built games from every kit (not in git)
```

Retro Kit's `kit/` and `games/` and everything in `city-nights/` are not touched (PRD criterion 8). `site/build.py` learns Lantern Box games in phase 4, not now.

## The speed test's results (1 November 2026)

| Device | Picture | Night | Blood-red rain | Dawn | Mist | Slowest 5% / longest |
|---|---|---|---|---|---|---|
| Pixel 11 Pro XL, Chrome 156 | 1973 × 886 at 1.64× | 70 fps / 13.6 ms | 56 / 16.0 ms | 73 / 13.9 ms | 56 / 14.5 ms | 25 / 33 ms |
| Computer, Chrome 152, RTX 5080 | 3840 × 2160 at 4.00× | 60 fps / 2.9 ms | 60 / 6.6 ms | 60 / 3.1 ms | 60 / 4.8 ms | 17 / 17 ms |

About 9 ms of headroom on the phone in its worst place. Claude's suggestions for phase 3, not decided: cap the picture's sharpness on very large screens (layer pictures took 329 MB at 4K); spread the heavier work (new tiles, pose repaints) across frames so the phone's frame times come out more even.

## Working with Barney

- He is a GP partner learning to build software, on Windows. Explain what you did and why in a few plain sentences, and always say what you could not test.
- **Commit after checking in with him.** At the end of each step, write the commit message to `CM<n>.txt` in the repo root (CM54 was step 3a, CM55 this commit rule, CM56 step 3b, CM57 step 3c, CM58 step 3d, CM59 the speed results, CM60 the sign-off, CM61 the layer lift and contrast, CM62 design system 2 and kit 0.5.0, CM63 design system 3 and kit 0.5.1, CM64 design system 4 and kit 0.5.2, CM65 design system 5 and kit 0.5.3, CM66 design system 6 and kit 0.6.0, CM67 design system 7 and kit 0.7.0, CM68 the ARCADE.md sound-effects rule, CM69 the design system 8 copy; use CM70 next) and ask. When he says yes, move the file into `.git`, stage only the paths that belong to the step, and run `git commit -F .git/CM<n>.txt`. Never push or create branches unless he asks (a push to `main` publishes the website).
- Python on his PC: `C:\Users\barne\AppData\Local\Programs\Python\Python312\python.exe`. The repo: `C:\Users\barne\Documents\Calude Code\Retro Games` (the folder really is spelt "Calude").
- **Speed can only be measured on his devices** (Chrome on his computer and on his Pixel). Close any other copy of a page before measuring.
- **The design system is the spec.** If the code needs something it does not cover, or a rule seems wrong, stop and ask Barney. Design changes are made in the design system first (in his Claude app project), then the copy here is refreshed.
- If something here is missing or unclear, ask rather than guess.

## Soundtrack

Barney's two MP3s for Gloam Hallow are in his Downloads folder: `C:\Users\barne\Downloads\Lantern_in_the_Moor.mp3` (2.4 minutes, 3.5 MB) and `The_Long_Vigil.mp3` (3 minutes, 4.3 MB). They go into the game's `music.js` in phase 4; together they add about 10 MB to the built file. Which place gets which track is decided with the gameplay.

## Layer lift and contrast (Barney, 2 November 2026; design system version 2, kit 0.5.0)

On the Pixel the World looked crowded, most in Blood-red rain and Night. The picture is the same 540 lines as on the computer, but only a few centimetres tall, and the feet of the three nearer back layers and the path sit within 27 lines of each other. Barney tuned two things per place on a throwaway copy of the test page (https://claude.ai/artifact/XWjgYNRSMRphhLAweesT9i, private; not in the repo):

| Place | Lift (lines) | Layer gaps | Tints, far to near (were) |
|---|---|---|---|
| Night | 60 | ×2.2 | 0.856 0.702 0.394 0.24 (0.52 0.45 0.31 0.24) |
| Blood-red rain | 70 | ×2.0 | 0.9 0.76 0.48 0.14 (0.52 0.45 0.31 0.14) |
| Dawn | 30 | ×1.5 | 0.82 0.64 0.4 0.22 (0.62 0.5 0.34 0.22) |
| Mist | 35 | ×1.0 | unchanged, 0.9 0.77 0.57 0.42 |

- **Layer gaps** widen the steps between the back layers about the nearest one: each tint becomes nearest + (tint − nearest) × gaps.
- **Lift** draws the picture as if the camera had risen by the lift, then slides it up by the same amount, so the path stays where it was. Each part sits higher by (1 − its parallax) × lift: the sky and moon by the whole lift, the clouds, back layers, mist bands and flyers by their own rates. The path, the rain, the fore layer (plants and overhanging branches) and the vignette do not move. The camera's own rise adds on top. The lift uses the full parallax rates, also with Reduce motion.
- **Done, 2 November 2026:** design system version 2 (tokens `night-tints` … with the new values, new tokens `night-lift` … , the README's World and Places wording, `bundle.js`: `lift` in `LV` and `at(k)` in `Scene.render`), the copy here refreshed, and kit 0.5.0 (the World block as `bundle.js`; `kitBegin` draws the lift). The kit's frame of each place matches the design system's own drawing to within 1 colour level in 255 over the top half of the picture, with Reduce motion on and off.
- One change from the tuning page: there the plants along the bottom edge dropped by 0.35 × lift, partly out of the picture. In version 2 the fore layer stays put, like the overhanging branches.

## The moor's houses (Barney, 2 November 2026; design system version 3, kit 0.5.1)

- On the Pixel a cottage on the moor looked sunk into its hill, its door and window showing through the ground. The cause: each house on backdrop layers 2 and 3 stood at the lowest ground under it, so on the moor's steep slopes its uphill side was buried in its own hill, and the door and window, cut after every solid part, still showed there.
- Now each moor house stands on the flattest, highest ground near its place (`level` in the moor's `content`): within its stretch of the layer, up to 0.35 of a stretch either way on layer 2 and 0.2 on layer 3 (which keeps it clear of the layer's tree). Nothing else moves. Over 1,500 sample houses a layer, the worst sinking fell from about 41 lines to about 20, and the typical one to about 3 lines more than the deliberate 4 or 5.
- Dawn's mist in the hollows of layers 3 and 4 (the nearer hollows, in front of the houses) is at 95% of version 2's: `a` 0 0 0.62 0.475 0.323. Barney chose it on a throwaway slider page (https://claude.ai/artifact/1tZneHSLi3ncMUE1kXdph1, private; not in the repo).
- **Stone circles (design system version 4, kit 0.5.2):** a circle's far stones are lifted up to 0.6 × its depth (about 4 to 9 lines) to look further back, with nothing under them, so on the Pixel they and the fallen stones floated above the hill, and a lifted stone behind a near one looked like a block on a block. Now each circle stands on a low rise of ground, exactly as high as its far stones are lifted (`drawStoneCircle`), so every stone and fallen stone sits on ground. The faint lit edge along that hill doesn't run over the rise. The circles' arch was three rectangles; it is now two rough uprights under a rough lintel, cut like the standing stones (`drawTrilithon`). Its shapes come from a random sequence of its own, so nothing else on the moor moved.
- **Doors and windows (design system version 5, kit 0.5.3):** every backdrop building stands 4 or 5 lines into its ground so it never floats, and its doors and windows are cut after every solid part, so the bottom of a door showed below the ground line, on the hill (a windmill on the moor on the Pixel). Now the doors and windows of the houses in a layer are clipped to the air above that layer's ground line (in `layer`). This is in every place; in the village and the old town it trims a few lines off door bottoms that ran into the ground.

## The new bosses and graded monsters (design system version 6, kit 0.6.0)

Version 6 was made in Barney's Claude app project late on 2 November; `HANDOVER-bosses.md` describes it and the steps. In the kit:

- The World block is `bundle.js` version 6, brought in by a three-way merge (the kit, `bundle.js` 5, `bundle.js` 6) that kept the kit's own changes; the one clash was round 12's bosses, which version 6 replaces.
- The Effects switch is added to the new boss code as the kit has it for the monsters: off, a boss's rim is the thin hard line (`hardRim`), and its glow, the glow behind it, the smoulder in its holes and its golden wisp's glow are left out.
- The boss calls use the new signatures (`Scene.bossAt`, `world.boss`): the approved `BOSS_NOD` and `BOSS_LOOK`, a cache object per canvas, `bossAura(lv)` and `BOSS_BOXES[lv]`.
- The boss's own canvas had 48 lines of room on top (`BOSS_PAD`) for the tree's glow; version 7 draws the glow onto the scene instead, so the room is gone.
- A boss's picture moves only with its pose time, `pz(t*rate)`, so the kit repaints it exactly when its pose steps (`BOSS_STEP`, the boss functions' own rates: about 5 to 6 times a second) instead of 20 times a second. The picture is the same; the work is about a quarter.
- Checked: every boss, with its glow and lit lines, matches the design system's own drawing to within 1 colour level in 255 on average, at and between pose steps; all four defeats and the graded monsters draw; Effects off draws without errors; both games build with no warnings and a clean console. On the computer one repaint of the gaping tree takes about 4.9 ms (17 times the old tree) and the moor mother about 0.7 ms, so the speed on the Pixel, at Dawn and in Mist, is the thing to check.
- Speed on Barney's Pixel (3 November, kit 0.6.0): Night 74 fps / 10.5 ms, Rain 54 / 13.1, Dawn 72 / 10.4, Mist 64 / 11.6, slowest 5% 25 ms, longest 33 ms, layers 107 MB. It passes in every place; against kit 0.4.0, 4 to 11 frames a second fewer (Dawn and Mist the most) and the longest frame 33 ms instead of 26 (`README.md`, The speed check).

## The bosses on a phone (design system version 7, kit 0.7.0)

Version 7 was made in Barney's Claude app project on 3 November, after his Pixel showed neither the bosses' grading nor their glow; `HANDOVER-bosses-7.md` describes it and the steps. In the kit:

- The World block is `bundle.js` version 7 (the lighter card blacks `CH`, `bossAura` 1.2 times larger and 1.6 times stronger, the new `bossGlow`), merged three ways as before; the one clash was the glow line in `bossInto`, resolved as version 7's with the kit's `&& FX` kept.
- The glow lightens what is behind it (canvas `screen`), so `Scene.bossAt` paints the cached boss without it (`noAura` true) and draws it straight onto the scene each frame with `bossGlow`, just before the boss; `world.boss()`'s defeat draws its fading glow the same way. Effects off: no glow. `BOSS_PAD` is gone.
- Checked: each boss with its glow matches the design system's own drawing to within 1 colour level in 255 over the glow's whole area, in all four places; the glow clearly lightens the scene beside each boss (Night 32 to 111 on a 0 to 255 scale, Rain 55 to 106, Dawn 84 to 141, Mist 97 to 171) and is gone with Effects off; defeats draw with Effects on and off; both games build with no warnings and a clean console. One glow takes about 0.1 ms at Dawn and 1.5 ms in Mist on the computer.
- Speed on Barney's Pixel (3 November, kit 0.7.0): Night 72 fps / 9.8 ms, Rain 58 / 13.9, Dawn 77 / 10.1, Mist 63 / 11.2, slowest 5% 25 ms, longest 41 ms, layers 111 MB. It passes in every place, within a few frames a second of kit 0.6.0 (`README.md`, The speed check).

## The play parts (design system version 8, step 4c)

Version 8 was made in Barney's Claude app project on 4 November and gathers in Gloam Hallow's play parts from step 4b's twelve review rounds: `components/play.js`, 18 new components and `bundle.js` 8.0.0. `HANDOVER-play-8.md` describes it, the copy (CM69) and step 4c, the kit change that brings the play parts into the kit; plan 4c with Barney before building. Until then the kit is still 0.7.0 and uses none of version 8.

## Still open (not phase 3)

PRD question 6 (Gloam Hallow's gameplay: the vault note's interview, then `GAMEPLAY-gloam-hallow.md` in step 4a), 8 (the wanderer's scarf: pencilled by Barney as no scarf and a long trailing red tie belt at the waist, settled in 4b), 9 (the game that proves the skill). The iPhone, the HP laptop, the Fire HD 8 and the computer's AMD graphics are still to be measured (report only).
