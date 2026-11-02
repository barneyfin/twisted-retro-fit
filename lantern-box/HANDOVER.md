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

- The approved design system (the spec): https://claude.ai/artifact/WHorELA7gRgEncv7E7vvEY. The copy in `lantern-box/design-system/` is version 1 of it.
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
- Picture: what Best, Faster and Fastest each change is not decided. Claude's suggestion, for Barney in 3d: Best at the device's sharpness (capped on very large screens), Faster at ordinary sharpness, Fastest at ordinary sharpness with Effects' glows off; Automatic times the first seconds of play and steps down a level while frames take longer than 25 ms.

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
- **Commit after checking in with him.** At the end of each step, write the commit message to `CM<n>.txt` in the repo root (CM54 was step 3a, CM55 this commit rule, CM56 step 3b, CM57 step 3c; use CM58 next) and ask. When he says yes, move the file into `.git`, stage only the paths that belong to the step, and run `git commit -F .git/CM<n>.txt`. Never push or create branches unless he asks (a push to `main` publishes the website).
- Python on his PC: `C:\Users\barne\AppData\Local\Programs\Python\Python312\python.exe`. The repo: `C:\Users\barne\Documents\Calude Code\Retro Games` (the folder really is spelt "Calude").
- **Speed can only be measured on his devices** (Chrome on his computer and on his Pixel). Close any other copy of a page before measuring.
- **The design system is the spec.** If the code needs something it does not cover, or a rule seems wrong, stop and ask Barney. Design changes are made in the design system first (in his Claude app project), then the copy here is refreshed.
- If something here is missing or unclear, ask rather than guess.

## Soundtrack

Barney's two MP3s for Gloam Hallow are in his Downloads folder: `C:\Users\barne\Downloads\Lantern_in_the_Moor.mp3` (2.4 minutes, 3.5 MB) and `The_Long_Vigil.mp3` (3 minutes, 4.3 MB). They go into the game's `music.js` in phase 4; together they add about 10 MB to the built file. Which place gets which track is decided with the gameplay.

## Still open (not phase 3)

PRD question 6 (Gloam Hallow's gameplay: the vault note's interview, then `GAMEPLAY-gloam-hallow.md` in step 4a), 8 (the wanderer's scarf: pencilled by Barney as no scarf and a long trailing red tie belt at the waist, settled in 4b), 9 (the game that proves the skill). The iPhone, the HP laptop, the Fire HD 8 and the computer's AMD graphics are still to be measured (report only).
