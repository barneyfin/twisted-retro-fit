# City Nights: the new crash pop (a kit change for Claude Code)

Written 29 October 2026 in Barney's Claude app project, where the design system lives. The design system is now **version 6**, and `city-nights/design-system/` is a fresh copy of it. This note says what changes in the kit and the test page. Design decisions are made there, not here: if something below looks wrong, stop and tell Barney rather than changing the drawings.

## What Barney decided

- The first crash pop (jagged burst, shattered pane, cloud, Antonio letters) was **rejected as too primitive** (29 October, 08:27).
- He chose round 2's **direction B, the smoke cloud** (08:44) and approved a version for each word (08:54): a cloud of smoke in a cream neon tube, the word in big comic letters on a rising curve, and neon debris that tells what happened.
  - **CRASH!**: parts fly off (a wheel, a spring, nuts, a bolt). Yellow letters, red edge, tag 轟.
  - **SMASH!**: glass breaks (shards, cracks, a broken headlamp). Red letters, yellow edge, tag 啪.
  - **BANG!**: something bursts (flames behind the smoke, shock rings, a hubcap, sparks). Pink letters, teal edge, tag 砰.
- **Bangers** (SIL OFL) is a new font, for the pop's letters only.
- **The pop still lasts `pop-time`, 1 s.** Barney sees a crash freezing the game for a few seconds while the timer keeps counting down (a penalty) and the fare stops. That freeze belongs to Grunge City Rider's gameplay (PRD question 4), not to the kit. The pop does not wait for it: after its second, the player sees the frozen taxi and the vehicle it hit. The kit needs no freeze of its own for this.

## Read first

1. `design-system/components/CrashPop/README.md`: the rules and how it is drawn.
2. `design-system/components/bundle.js`: `CityNights.crashPop` (the three drawings as data) and `drawCrashPop` (the Canvas 2D code that draws them). **Port both as they are.** The design system's preview draws with this same code, so if the kit uses it unchanged the game shows exactly what Barney approved.
3. `design-system/README.md`, the Crash pop, Colour and Type sections; `tokens.json` / `tokens.css` for the new tokens: `pop-crash-light`, `pop-crash-deep`, `pop-smash-light`, `pop-smash-deep`, `pop-bang-light`, `pop-bang-deep`, `pop-box`, `--font-comic`, the `pop-word` type style, and the new `pop-time` note.

## What changes in the kit

1. **The drawings.** In `kit/city-nights.js`, replace `POPS` and the drawing part of `drawPop` with the design system's `crashPop` data and `drawCrashPop`. The drawer looks colours up by token name; the kit already reads its named colours from `city-nights.css` into `colours`, so feed it from there (add `sodium` and the six `pop-*` colours to that list) rather than reading CSS during play.
2. **Draw each word once, not every frame.** Today `drawPop` redraws the whole pop with its shadows on every frame. The new drawings have 13 to 18 layers and up to 15 glows; one word took about 0.2 s at 720 lines in a test browser with no graphics chip. Draw all three words into their own canvases at the size the window needs: while the title screen shows, and again after a resize. Each frame of a pop is then just that canvas drawn with the spring scale and the opacity. `POP_SCALE`, `POP_ALPHA`, `POP_FADE` and the ease-out stay as they are.
3. **Size and place.** The pop's box is `pop-box`, 1080 × 700 on a 720-line window: 810 × 525 picture pixels at 540 lines, the same on phones as on computers. It is centred on the crash point (`startPop` already finds it) and moved only as far as it needs to stay inside the picture. The old 480 × 300 box, its tilt and the phone rule (0.54 of the picture's height) go.
4. **Fonts.** Add `Bangers-Regular.woff2` to `kit/fonts/` (copy it from `design-system/fonts/`, so the build's font check matches) and `Bangers-OFL.txt` to `kit/licences/`, and update the licences README. The build embeds it like the others. Wait for Bangers 400 and Noto Sans TC 700 to load before drawing the words.
5. **Unchanged:** the random word, never the same twice running; the pop on its own canvas over the picture; no grain; Reduce motion fades only.
6. If the kit's stylesheet copied the old `.cn-pop` burst classes, remove them; `bundle.css` now keeps only the pop's box and its one-second animation (for HTML previews).

## The test page

- In `games/cn-sampler`, let each of the three words be fired on its own, so Barney can see them over the street, and keep a way to fire a random one.
- Show how long drawing the three words took, alongside the speed check, so Barney can read it on his PC and his Pixel.

## Checks before handing back

- Side by side with the design system's CrashPop preview, each word looks the same: cloud, tubes, debris, letters, tag.
- A pop doesn't add to frame time during play (the speed check's numbers hold while a pop shows).
- Reduce motion: no spring, no dip, a fade in and out only.
- A resize mid-game draws the words again at the new size.
- The fonts check in the build passes with Bangers added.
- Tell Barney the drawing time on his PC and phone.

## Working rules (as before)

- Don't edit `city-nights/design-system/`. Changes go to the design system first.
- Git is Barney's: hand him the commands. The commit message for this change is **CM17.txt** in the repo root (CM16 is the design system refresh that brought this note).
