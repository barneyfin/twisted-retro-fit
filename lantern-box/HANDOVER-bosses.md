# Lantern Box: handover for the new bosses and graded monsters (design system version 6)

This note hands design system version 6 to Claude Code: four new bosses and graded black card for the monsters. The design work was done in Barney's Claude app project, *Browser Arcade*, on 2 November 2026 (the Gloam Hallow Bosses page, rounds 1 to 10). Read this whole note before changing any code. Written late on 2 November 2026.

## What changed, and why

- **Barney reopened the bosses** (2 November, 21:15). The cauldron witch was out of character for the game and was to be replaced completely. Colouring the bosses in faded level colours was wrong: they should be strong black silhouettes like the monsters, with only a small nod to the level's colour. The tree needed reworking.
- **The new look, for all four bosses**: black card cut-outs drawn the monster way, each piece graded from charcoal inside to ink at its edge inside a 2 to 3px ink edge; ember eyes, mouths, rim and glow as the monsters; and the nod to the level's colour, which is only a few inner lines lit faintly in it plus a glow behind the boss.
- **The four bosses**: the veiled ghost (Night) and the tentacled skull (Blood-red rain, now with two angular horns), both drawn 1.2 times their first size; the gaping tree (Mist), redrawn, leaning with the wind, a small face in the bark, roots spreading from a contoured base, angular side branches and no limbs; and **the moor mother** (Dawn) in place of the witch: antlers, a split face, an eye cluster on a spiked shoulder, an angular sickle claw and four spider legs. The size rule "no taller than the walker" is gone.
- **The monsters are graded too** (Barney, 23:26: "grade them all"). Every body piece of the five monsters in play (mouth-hat, crawler, flyer, ghoul, walker) is filled charcoal to ink inside an ink edge, and every limb segment 3 or more wide is graded across its width. Hairline claws and twigs stay ink. Scenery and the wanderer stay flat ink.
- **Removed**: round 12's bosses and their faded palettes (`BOSS_PAL` and 35 `boss-*` colour tokens), the cauldron witch, and the old single `BOSS_BOX`.
- **Your places work is all kept.** When version 6 was published (about 00:05 on 3 November) the artifact was at your version 5. Version 6 was built on top of your live files, so the lift, the layer steps, the moor's houses and stone circles and the doors ending at the ground are all in it. Nothing in the places was touched.

## Your steps

1. **Refresh the copy** in `lantern-box/design-system/` from the artifact, version 6 (https://claude.ai/artifact/WHorELA7gRgEncv7E7vvEY). Changed in version 6: `README.md`, `tokens.json`, `components/bundle.js`, `components/Bosses/README.md`, `components/Monsters/README.md`. Nothing else changed.
   - `tokens.css` by hand: remove the 35 `--boss-night-veil-top` … `--boss-mist-moss` palette lines; add `--card-black-1: #100e13`, `--card-black-2: #19161d`, `--card-black-3: #231f27`, `--card-charcoal: #2d2832`, `--boss-mist-moss: #313426` (a new value, the moss strands on the tree), `--boss-dawn-dead-eye: #e9e2d4`. The four `--boss-*-aura` values are unchanged. Picture gains `boss-scale` (1.2).
   - `ABOUT-THIS-COPY.md`: say version 6, and that it replaces the bosses and grades the monsters.
2. **The kit** (`kit/lantern-box.js`): bring in the World block as `bundle.js` version 6, keeping the kit's own changes as you have for versions 2 to 5. The kit's stylesheet: drop the old `--boss-*` palette lines and add the new tokens, as in `tokens.css`.
3. **Fix the boss calls** in the kit. The new functions take more arguments, and called the old way they draw the bosses flat, with no glow and no lit lines. The new signatures:
   ```js
   bossInto(c, s, lv, t, o, dx, dy, BOSS_NOD, noAura, cache, BOSS_LOOK); // cache: one object kept per canvas
   bossDefeat(c, M, s, X, Y, u, seed, lv, cache);                         // pieces over BOSS_BOXES[lv]
   bossAura(lv);                                                          // [colour, height above the feet, radius, strength], grown with the boss
   ```
   The calls to change (line numbers as of kit 0.5.3):
   - `Scene.bossAt`, about lines 1467 and 1470: both `bossInto` calls. Keep one cache object with `this.bossC`.
   - `world.boss()`, about lines 2733 to 2736: `bossInto(d.c, …, 0, 0, true)` becomes `bossInto(d.c, s, lv, f.t, f.opt, 0, 0, BOSS_NOD, true, cache, BOSS_LOOK)`; the glow uses `bossAura(lv)` instead of `BOSS_AURA[lv]`; `bossDefeat(…, u, 77)` becomes `bossDefeat(…, u, 77, lv, cache)`.
   - Anything else that used `BOSS_BOX` uses `BOSS_BOXES[lv]`.
   - `BOSS_LOOK` and `BOSS_NOD` are the only approved settings. The boss functions still accept other values left from the rounds when options were compared; never pass them.
4. **The monsters** need no new calls: `monsterInto` sets up the grading (`CARD`) while it draws, and `limb()` and the monsters' body fills use it. If the kit's `monsterInto` is its own copy, it needs the two `CARD` lines from version 6's.
5. **Check**:
   - The boss's cached canvas (`bossAt`, 460 × 330 at scale) still holds everything: the moor mother reaches about 270 above her feet and 136 either side, and the tree's glow (radius 190, centred 150 up) is clipped about 40 picture pixels at the top. Grow the canvas or draw the glow separately if the clip shows.
   - Speed on Barney's Pixel, at Dawn and in Mist: the new bosses are heavier to draw (more pieces, gradients, cut-outs) and the boss is repainted `BOSS_HZ` (20) times a second. If it costs too much, a lower `BOSS_HZ` is fine: the poses only step 8 times a second.
   - The test page (`lb-sampler`) shows all four bosses, their defeats and the graded monsters; compare the kit's frames with the design system's own drawing, as you did for version 5.
   - Say what you could not test.
6. **Commit after checking in with Barney**, as `HANDOVER.md` says: the next message file is CM66 (unless you have used it since). Stage only the paths that belong to this work, including this note. Add a short section to `HANDOVER.md` for version 6, pointing here, as you did for versions 2 to 5.
7. **Your next design-system change is version 7.** There are now two writers on the design system (you and Barney's Claude app project), so read the artifact again just before you publish, and build on what is there.

## Sizes (picture pixels, measured over a stepping cycle)

| | Height | Width | Defeat box (`BOSS_BOXES`) |
|---|---|---|---|
| The walker (for scale) | 194 | | |
| The veiled ghost | 247 | about 190 | [-104, -252, 98, 28] |
| The tentacled skull | 206 | about 330 | [-208, -212, 138, 32] |
| The gaping tree (windswept) | 255 | about 250 | [-132, -262, 160, 12] |
| The moor mother | 270 (antler tips) | about 270 | [-140, -278, 140, 12] |

## Where things are

- The design system, version 6: https://claude.ai/artifact/WHorELA7gRgEncv7E7vvEY. Its Bosses and Monsters components describe the parts; the README's Colour section has the graded-blacks rule, and its new Versions section lists versions 1 to 6.
- The bosses rounds (Barney's review page): https://claude.ai/artifact/LUmdJyoqMEWimTLB1xyaUL
- These links open for Barney; read them with your artifact tool as you did for versions 2 to 5.

## Still open (not this step)

- What each boss does in play: Gloam Hallow's gameplay (step 4a).
- Whether the wanderer should be graded too: version 6 keeps it flat ink, as Claude's reading of "grade them all"; Barney may say otherwise.
