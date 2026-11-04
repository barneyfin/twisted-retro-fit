# Lantern Box: handover for design system version 10 (lit through a cloud)

This note hands design system version 10 to Claude Code. It follows `HANDOVER-design-9.md`. Written 4 November 2026 in Barney's Claude app project. **The kit stays 0.8.0.**

## Do versions 9 and 10 together

When this note was written, the repo's copy of the design system was still version 8: version 9 had not been brought in. So do both at once:

- Read `HANDOVER-design-9.md` for version 9's four fixes, and this note for version 10.
- Refresh the copy **once, from `dist/lantern-box-design-system-10/`**. It contains version 9's changes too, so ignore `dist/lantern-box-design-system-9/`.

Barney decides whether that is one commit or two.

## What version 10 is, and why

On his Pixel, at Night, Barney saw two things that looked wrong: the far bat swarm showed as copper shapes against a violet cloud, and a distant tower on a hill in front of a cloud looked lighter than the cloud.

It is in the design system's own drawing, not the kit's. It goes back to round 12's look and is easy to reproduce from `bundle.js`.

The look depends on nearer things being darker: each backdrop layer is `ink` mixed towards the place's air, more so the further away it is. But Night's clouds (bodies `#4a2752`, `#2e1838`) and Blood Red Rain's are darker than backdrop layers 1 and 2 and the far swarm. So wherever one of those crosses in front of a cloud, it comes out lighter than the cloud, as if lit from the front or cut out of it. Blood Red Rain shows it where tall spires reach into the clouds. Dawn's clouds sit too high to be crossed, and the Mist has none.

Barney chose option A of three (the other two were hazing the clouds' lower parts, or keeping the clouds and the far parts apart). **Option A: whatever stands in front of a cloud is lit through it.** Where a cloud is behind them, layers 1 and 2 and the far swarm are `ink` mixed towards **the cloud's own colour** instead of the air, by three quarters of their usual tint. So they read a step darker than the cloud, in its hue, and keep their usual colour everywhere else. A paper theatre lit from behind would show them that way.

The nearer layers (3 and 4), the big near bats, the crows and the leaves are unchanged. They are already darker than the clouds.

## The design system's code (`bundle.js` 10.0.0)

- `THRU_CLOUD = 0.75` (token `thru-cloud` in Picture, so `tokens.css` gains `--thru-cloud: 0.75`).
- `cloudFoot(cvs, cs)`: worked out once in `Scene.ensure`, when the clouds are made (`this.cache.clB`). It gives the lowest picture line any cloud reaches. At the 886-line test size:
  - Night: 316 lines;
  - Blood Red Rain: 255;
  - Dawn: 247;
  - the Mist has no clouds, so nothing happens there.
- `Scene.render`:
  - The clouds are drawn into the scene as before, and also into `CF`, a picture of the clouds' band (from the top of the picture down to the foot, with the same transforms).
  - `thr(paint, mix)` paints a part into a second band picture `OV`, keeps it only where a cloud is (`source-in` with `CF`), takes it from the cloud's colour towards `ink` (`source-atop`, `ink` at alpha `1 - mix`), and lays `OV` over the scene.
- **The three calls:**
  - layer 1: `mix = tn[0] * THRU_CLOUD`, its picture still in `off` after `this.layer`;
  - layer 2: `tn[1] * THRU_CLOUD`;
  - the far swarm: `tn[1] * 0.9 * THRU_CLOUD`, `drawSwarm` drawn again into `OV`.
- **Per pixel**, with cloud colour `C` and cloud cover `a` behind it, the part becomes `mix(part, mix(ink, C, m), a)`. That is the cloud's body, lobes, rims and lit undersides, each with its own colour, so a cloud's bright rim passing behind a tower lightens it there too.
- Exported as `W.parts.THRU_CLOUD` and `W.parts.cloudFoot`.
- `tokens.json` is version 10.
- The Places and Flyers READMEs carry the rule and a "## Version 10" note. The main README's Colour section has the rule, and its version history has an entry for version 10.

**Checked in the Claude app project:**
- Version 10's frames match option A, which Barney chose from rendered comparisons, pixel for pixel: Night's tower and swarm, Blood Red Rain's spires. Dawn and the Mist are unchanged.
- All 49 previews run with no errors.
- In the design system's own drawing, limiting the work to the clouds' band left the drawing time unchanged (the difference was within measurement noise). Done across the whole picture, it had cost about half as much time again.

## For the kit

The kit draws the clouds and the layers its own way (tiles slid, pictures painted once), so build the same result its way.

1. **Each frame**, while drawing the clouds, keep a picture of the clouds' band. Its height is the clouds' foot in device pixels.
2. **After each of** layer 1, layer 2 and the far swarm, lay over the scene that part as it appears in front of a cloud:
   1. draw the part into a second band picture;
   2. keep it only where a cloud is;
   3. take it towards `ink` by `1 - mix`;
   4. draw the result over the scene.
3. **Skip the work** whenever the part has nothing above the clouds' foot on screen: a layer whose top is below it, or a swarm that is elsewhere.

Bring in the World block as `bundle.js` 10, as before, keeping the kit's own changes. The kit's camera rise moves the layers and clouds by their parallax, and the band must follow: use the transforms the kit draws them with.

**Speed.** This is new work every frame at Night and in Blood Red Rain: up to three band composites, with Night's band 58% of the picture tall. Measure on the Pixel before and after, in the Night and Blood Red Rain legs of the speed check and at the Mist's boss, and report the figures. If it costs too much, tell Barney before cutting anything. Ways to cut it include:
- a lower-resolution band;
- checking only where the layers' tops actually reach the clouds.

**Effects off and Reduce motion**: nothing special. It is not a glow, and under Reduce motion the composite simply follows the slower clouds and layers.

## Refresh the copy

An exact copy of version 10 is in `dist/lantern-box-design-system-10/`, with checksums in `dist/lantern-box-design-system-10.sha256`. It holds 111 files, as before.

Against the repo's copy as it stands (version 8), 10 files differ:
- `ABOUT-THIS-COPY.md`
- `README.md`
- `tokens.json`
- `tokens.css`
- `components/bundle.js`
- `components/play.js`
- `components/MonsterAttacks/README.md`
- `components/BossAttacks/README.md`
- `components/Flyers/README.md`
- `components/Places/README.md`

Check the staged copy against its checksums, copy it over `lantern-box/design-system/`, then check again in place. `git status` should then show only those files in the copy.

In `HANDOVER.md`, "Where things are", the copy is now version 10 (`HANDOVER-design-9.md`, `HANDOVER-design-10.md`). The open item for 4d about pieces and monsters stays open.

## Checks

- **The build and the console.** Both games build with no warnings, and the console is clean.
- **On the Pixel:**
  - **at Night**: a distant tower, hill or the swarm in front of a cloud reads as a dark silhouette in the cloud's own violet, and everywhere else looks as before;
  - **in Blood Red Rain**: the spires that reach into the clouds;
  - **at Dawn and in the Mist**: unchanged;
  - version 9's checks, from its note.
- **The speed figures, as above.**
- **Say what you could not test.**

## Commit

Check in with Barney first, as always. Use the next CM number in HANDOVER.md's list. Stage named paths only. Never push.
