# Lantern Box: handover for design system version 7 (the grading and the glow on a phone)

A short note handing design system version 7 to Claude Code. It follows `HANDOVER-bosses.md` (version 6, kit 0.6.0). Written 3 November 2026 in Barney's Claude app project. Read it all before changing any code.

## What changed, and why

- On his Pixel, Barney found that the bosses' graded blacks did not show, and the glow behind them showed barely or not at all. He chose option B of the Gloam Hallow Bosses page's round 11 (each boss drawn in its own place at the game's scale) and asked for the monsters to match.
- **The card blacks are lighter.** `CH` (tokens `card-black-1` to `card-charcoal`) is now `#060508, #17141b, #27232d, #3a3544, #504a5c` (was `…, #100e13, #19161d, #231f27, #2d2832`). The monsters and the bosses share these, so both change, and nothing else in their drawing does.
- **The glow is stronger and lightens what is behind it.** `bossAura(lv)` now returns the glow 1.2 times larger and 1.6 times stronger (at most full). A new function, `bossGlow(c, X, Y, lv, fade)`, draws it in picture units with the boss's feet at (X, Y), using canvas `screen` blending, held at full strength out to 35% of its radius. Token `boss-glow` in Picture describes it.
- Nothing else changed. The live design system was still version 6 when version 7 was built on it.

## Why the kit showed no glow

`Scene.bossAt` paints the boss, glow included, into its own cached canvas `E.cv`, then draws that onto the scene. A glow painted on a transparent canvas has nothing behind it to lighten, so it can only ever be a faint wash. With `screen` blending it must be drawn **straight onto the scene, each frame, before the boss**.

## Your steps

1. **Refresh the copy** in `lantern-box/design-system/` from the artifact, version 7 (https://claude.ai/artifact/WHorELA7gRgEncv7E7vvEY). Changed: `README.md`, `tokens.json`, `components/bundle.js`, `components/Bosses/README.md`, `components/Monsters/README.md`.
   - `tokens.css` by hand: `--card-black-1: #17141b`, `--card-black-2: #27232d`, `--card-black-3: #3a3544`, `--card-charcoal: #504a5c`. Picture gains `boss-glow`.
   - `ABOUT-THIS-COPY.md`: version 7.
2. **The kit** (`kit/lantern-box.js`): bring in the World block as `bundle.js` version 7, keeping the kit's own changes. That means the new `CH`, `bossAura` and `bossGlow`, and `bossInto` and `renderBossStrip` calling `bossGlow`. Keep the kit's `&& FX` on the glow: with Effects off there is no glow.
3. **Draw the glow onto the scene** (line numbers as of kit 0.6.0):
   - `Scene.bossAt`, about lines 1470 to 1476: paint the cached boss with `noAura` true (`bossInto(c, …, BOSS_NOD, true, E, BOSS_LOOK)`). Each frame, just before `ctx.drawImage(E.cv, …)`, call `if (FX) bossGlow(ctx, bx, by, lv, 1)` in the same picture-unit transform. `BOSS_PAD` was only there to fit the glow in `E.cv`, so it can go or stay.
   - `world.boss()` defeat, about lines 2906 to 2907: replace the hand-made gradient with `if (fade > 0 && FX) bossGlow(f.ctx, X, Y, lv, fade)`.
   - The non-kit path in `bossAt` (line 1471) already passes `noAura` false, and `bossInto` now draws through `bossGlow`, so it needs nothing.
4. **The monsters** need nothing beyond the new `CH`: their grading reads it.
5. **Check**:
   - On the Pixel at all four places: the glow is clearly visible round each boss, including against the Mist's pale sky, and the grading shows on bosses and monsters. Compare with the round 11 page's option B: https://claude.ai/artifact/LUmdJyoqMEWimTLB1xyaUL
   - Speed on the Pixel: the glow is now a large `screen` fill every frame (up to 456 picture pixels across, the Mist's tree the largest). Measure Mist and Dawn. If it costs too much, tell Barney before cutting anything.
   - Effects off: no glow, bosses otherwise unchanged.
   - Say what you could not test.
6. **Commit after checking in with Barney**: CM67 is next (unless you have used it since). Stage only this work's paths, including this note. Add a short section to `HANDOVER.md` for version 7, pointing here.
7. Your next design-system change is version 8. Read the artifact again just before you publish.
