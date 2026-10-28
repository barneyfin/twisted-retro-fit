# City Nights: handover for phase 3

This note hands the City Nights kit to Claude Code for phase 3, the code kit and test page. Phases 1 and 2 were done in Barney's Claude app project, *Browser Arcade*, where the design work stays. Read this whole note before writing any code. Written 28 October 2026.

## What City Nights is

The arcade's second style kit: a real Hong Kong street at night, after Barney's own photo series *Hong Kong City Nights*. Warm amber streets, a wall of lightbox and neon signs overhead, HDR grain and halos, ghosted people, traffic in places. Gritty and real, not cyberpunk. Games look into the screen. The pilot game is **Grunge City Rider**, a taxi game (phase 4).

It is **not** Retro Kit. Do not use the `retro-kit` skill, Retro Kit's look (glass panels, Geist, banded shape art) or its rules on "no film grain". ARCADE.md's arcade-wide rules apply in full; Retro Kit's own rules do not.

## Read first, in this order

1. `ARCADE.md` (repo root): the rules for every kit and game.
2. This note.
3. `city-nights/design-system/README.md`: the kit's rulebook. With it: `words.md` (every Chinese word), `tokens.json` and `tokens.css` (every named colour, type style, size and timing), `components/*/README.md` (one per part) and `components/bundle.css` (the interface already written as CSS; most of the kit's stylesheet starts here). See `ABOUT-THIS-COPY.md` there.
4. `city-nights/speed-test/README.md` and `src/`: the WebGL2 street that passed the speed test. Its drawing code becomes the kit's drawing tools.
5. `kit/retro-kit.js`, `kit/retro-kit.css`, `kit/build.py`, `kit/template.html`: Retro Kit's shell and build, which City Nights copies and restyles. Read them; never change them.

## Where things are

- The approved design system (the spec): https://claude.ai/artifact/4DhkqfUBGEBm3Qj2DeprsM. The copy in `city-nights/design-system/` is version 4 of it.
- The PRD (approved; phase 3 steps added): https://claude.ai/artifact/MpbkvchnATc7ApmEY5uYac
- The screens round, the mock-ups behind the design system: https://claude.ai/artifact/LjxZbtTQiChgKQhfWSyDsz
- The approved look (round 9 directions page): https://claude.ai/artifact/Qoj1ttkA8BsZgJRaEDokb8
- These links open for Barney; you may not be able to read them. Everything phase 3 needs from them is in this repo or below.

## Decided (all Barney's, 28 October 2026)

**Look and layers**
- Two layers. **World**: the street drawn with WebGL into a 540-line picture that fills the window, plus the meter, district caption, power-ups and crash pop. **Interface**: everything a player reads or presses, made as lit signs.
- **Lightbox panels** for every panel during and after play: pause, settings, game over, initials, high scores, the rotate notice. **Neon** for the title screen's menu only (the logo is a neon sign too). Neon in the World (signs, the crash pop) is the street's own.
- The look is round 9 as the speed test draws it: grain overall 75% with the zone levels in `tokens.json` (grain family), option 2 grain (each surface writes its level as it is drawn), glow, fog, vignette.

**The meter (the HUD)**
- A lightbox sign headed 的士 TAXI METER, bottom left, at 82.5% of its round 9 size, fare (six places), time (two), speed (three) in red seven-segment digits. On phones it keeps its place and size; only its row labels grow, to at least 10 CSS px. The district caption sits above it. The speed test's `tail.js` draws it; the Meter component's README has the geometry.

**Settings** (shared across the arcade)
- Rows, in order: Volume, Effects ("Glow around lights and signs."), Reduce motion ("Less sway and roll from the taxi on corners."), Picture (Automatic, Best, Faster, Fastest). No Solid panels row: lightbox panels are already solid.
- Shared settings live in Retro Kit's `retrokit.settings` object (`volume`, `muted`, `effects`, `reduceMotion`, `solid`). City Nights reads and writes the ones it shows and must leave `solid` as it finds it. Picture is City Nights' own (suggested: its own key, so Retro Kit games never see it; confirm with Barney in 3b).
- Picture, Automatic: time the first seconds of play; turn edge smoothing off if frames take longer than 16 ms, then draw at ordinary sharpness if they still take longer than 25 ms. Best = 4x smoothing at full sharpness, Faster = no smoothing, Fastest = no smoothing and ordinary sharpness. The speed test's `#smooth0` and `#res1` show what each costs.

**Scores**
- The score is the fare. In text `HK$412.80`; on the meter and in dark insets, seven-segment digits.
- High scores per game in Retro Kit's format: a top-ten array of `{"s": <number>, "i": "<initials>"}`. The fare is saved in whole cents (HK$412.80 as 41280) so `s` stays a whole number; the website will be taught to show it as a fare in phase 4. Key name to settle with Barney in 3b.

**Other**
- Browsers without WebGL2 get a clear message that the game needs a newer browser; no 2D fallback.
- Power-ups are small lightbox sign tokens (時 green, 錢 yellow, 快 red, 保 blue, 雙 cream), hovering over the road. What each does is phase 4.
- The crash pop is CRASH!, SMASH! or BANG! lit as a neon burst right over the taxi and the vehicle it hit, for one second. See the CrashPop README.
- Fonts: use the files in `city-nights/design-system/fonts/` (the two Chinese fonts are cut down to the word list) and their licences. A new Chinese word goes back to Barney's Claude app project first: it is added to the design system's word list there, the fonts are re-cut there, and the new files are copied here. Do not install fonttools on Barney's PC.

## Phase 3: the steps

Each step ends with a check-in: tell Barney what you built, what you checked, what you could not check, and write a commit message for it (below). He reviews before the next step.

- **3a. Skeleton.** `city-nights/kit/` with the fonts and licences, `build.py` (copied from Retro Kit's and adapted: one offline file per game in `dist/`, fonts embedded, rule checks), `template.html`, and an empty game that builds. Build checks to add: no network requests, no image files, no colour codes in games (named colours only), every Chinese character in a game present in the fonts, the photosensitivity limits where they can be checked.
- **3b. The shell.** `city-nights.js` and `city-nights.css`, copied from Retro Kit's shell and restyled to the design system: title (neon menu, logo, best fare, tiles, key hints), pause, settings, game over, initials, high scores, the rotate notice, phone touch and the touch hint, sound effects (Retro Kit's set), saving, full screen, the WebGL2 check. Over a plain dark backdrop for now.
- **3c. The drawing tools.** The speed test's street (`street-gen.js`, `gl.js`, `tail.js`) turned into tools a game calls: the street and its four districts, signs, people, traffic, the taxi and its motion, glow, grain and fog, the meter and caption, power-up tokens and the crash pop. The tools draw; games decide what happens.
- **3d. Test page and finish.** `city-nights/games/cn-sampler/`: every drawing part and every screen, with the frame-rate readout; the automatic Picture setting; Barney's speed check; `city-nights/README.md`.

**Phase 3 ends when** the test page matches the design system, the speed still passes on Barney's computer and Pixel (at least 30 fps with frames drawn in 25 ms or less on the phone, 60 fps on the computer, in Chrome, in Mong Kok), and the build gives no warnings and the console is clean.

## Folder layout (from the PRD)

```
city-nights/
  HANDOVER.md        this note
  README.md          how to play, build and add a game (3d)
  design-system/     copy of the approved design system
  kit/               city-nights.css, city-nights.js, build.py, template.html, fonts/, licences/
  games/cn-sampler/  the test page
  speed-test/        phase 1, kept as it is
dist/                built games from both kits (not in git)
```

Retro Kit's `kit/` and `games/` are not touched (PRD criterion 7). `site/build.py` learns City Nights games in phase 4, not now.

## Working with Barney

- He is a GP partner learning to build software, on Windows. Explain what you did and why in a few plain sentences, and always say what you could not test.
- **Git is his.** Never commit, push or create branches. At the end of each step, write the commit message to `CM<n>.txt` in the repo root (CM10 was the last; use CM11 next) and give him the commands for PowerShell one at a time, with the full path, the output to expect and what to do if it fails. He moves the file into `.git` and runs `git commit -F .git\CM<n>.txt`.
- Python on his PC: `C:\Users\barne\AppData\Local\Programs\Python\Python312\python.exe`. The repo: `C:\Users\barne\Documents\Calude Code\Retro Games` (the folder really is spelt "Calude").
- **Speed can only be measured on his devices** (Chrome on his computer, with an RTX 5080, and on his Pixel 11 Pro XL). Close any other copy of a page before measuring: two copies fight over the graphics chip.
- **The design system is the spec.** If the code needs something it does not cover, or a rule seems wrong, stop and ask Barney. Design changes are made in the design system first (in his Claude app project), then the copy here is refreshed.
- If something here is missing or unclear, ask rather than guess.

## Still open (not phase 3)

PRD question 4 (Grunge City Rider's gameplay, including what the power-ups do), 6 (the game that proves the skill), 7 (a city sound bed), 8 (a Cantonese reader checks `words.md` before the kit is final).
