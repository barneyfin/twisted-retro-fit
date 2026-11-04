# Lantern Box: handover for design system version 9 (four fixes from step 4c)

This note hands design system version 9 to Claude Code. It follows `HANDOVER-play-8.md`. Written 4 November 2026 in Barney's Claude app project.

Version 9 makes four small fixes found while building the kit in step 4c (kit 0.8.0), from HANDOVER.md's "Notes for design system version 9". Barney bundled them into one version and asked for no other changes. **The kit stays 0.8.0**: the fixes are small and belong to 4c.

**Read fix 1 first. Version 9 fixes the double eyes differently from the kit, so the kit's fix needs replacing, not just checking.** Fix 2 should already match. Fixes 3 and 4 are new to the kit.

## What changed

| Fix | File and function | Version 9 | Kit |
|---|---|---|---|
| 1. The mouth-hat's second pair of eyes | `play.js` (from `mvmon.js`): `hatmawP` | The signal eyes follow the hop, as the mouth-hat's own eyes do. The crawler and the flyer are unchanged | **Replace**: remove the three `if(P.t!=null)` gates, add the follow |
| 2. The Veiled Ghost's "behind" signal | `play.js` (from `mvboss.js`): `BS_FIGHT.night`, the window 3.5 to 4.0 s | `st.alpha=1-0.38*Math.sin(u*Math.PI)` | **Check** it matches |
| 3. The moor's crow flocks | `bundle.js`: the scene's flyers, the `L.fly==="crows"` branch | `drawCrowFlocks(…, mixc(INK,AIR[lv],0.25))`, was `tn[1]*0.9` | **Bring in** |
| 4. The place list's names | `bundle.js`: `LV` (`name`, `place`, `desc`) | The agreed proper names, capitalised | **Bring in** |

Versions: `bundle.js` is 9.0.0 and `play.js` 1.0.1, each with a header note. The READMEs that changed:
- `README.md` (the version history, and two lines that name versions);
- MonsterAttacks, BossAttacks, Flyers and Places (a "## Version 9" note each, plus one rule line in MonsterAttacks, BossAttacks and Flyers, and the place names in Places).

Nothing else changed: no tokens, no CSS, no previews.

### 1. The signal eyes: why version 9 differs from the kit

The Claude app project checked each posable monster at rest and in its duel (the MonsterAttacks preview's loops, sampled frame by frame). It found:

- **Only the mouth-hat moves its own eyes.**
  - `bundle.js`'s `crawler` and `bat2` draw their eyes at fixed places, the same places as the signal eyes, so their signal eyes always sat exactly on them. They showed no second pair at rest or anywhere else.
  - `hatmaw` draws its eyes inside its hop's lift and squash (`translate(0,dy)`, `scale(1/sq,sq)`), so the fixed signal eyes part from them whenever it is off the ground.
- **The gate doesn't fully fix the mouth-hat.** In its duel the mouth-hat hops in with its pose frozen step by step: `P.t` is set and moves on with each hop. At the top of each hop the two pairs part even though the pose is frozen. In the review loop that is about two frames a cycle (for example 2.8 and 3.0 s in the MonsterAttacks preview's mouth-hat duel).
- **The gate costs the flyer part of its signal.** After each dive the flyer's eyes cool from flared over about 0.7 s while its wings beat again (`P.hot` falling from about 0.4, `P.t` unset). With the gate, they snap back to plain at once. The crawler never signals with its pose unfrozen, so the gate changes nothing for it.

So version 9 makes the mouth-hat's signal eyes follow its hop. It uses the same lift and squash as `hatmaw`, from the same time its pose was drawn with (`P.t` if set, otherwise `t`), and `rm` as `hatmaw` uses it. The crawler and the flyer are left as version 8 drew them.

In `hatmawP`'s returned draw function, the last lines are now:

```js
      {const tt=P.t!=null?P.t:t,hop=Math.max(0,Math.sin(tt*(rm?1.4:2.6)+m.ph)),sq=1-hop*0.06;c.save();c.translate(0,-hop*(rm?3:9));c.scale(1/sq,sq);
      moEyes(c,o,[[-13,-41,0.35],[-5,-43,0.15]],3.4,1.4,h);c.restore();}c.restore();};},
```

`t`, `m` and `rm` are `hatmawP`'s own arguments.

**What it was checked against**, all in the review page's own drawing:
- At rest: each of the three monsters at eight moments, at five times their size. Each shows one pair of eyes; version 8 shows two on the mouth-hat whenever it is off the ground.
- In the duels: version 9 draws the crawler's and the flyer's duels exactly as version 8 did, pixel for pixel, at 120 moments over 24 s. The mouth-hat's differs only on the frames where version 8 showed two pairs.
- The signals still swell and flare.

**For the kit:**
- Take out the `if(P.t!=null)` you added before `moEyes` in `crawlerP`, `bat2P` and `hatmawP`.
- Give `hatmawP` the block above.
- If the kit paints the mouth-hat's pose into a cached picture once per puppet step, compute `hop` from the same time that picture was painted with. Otherwise the eyes run ahead of the body between steps.

### 2. The Veiled Ghost's fade

The design system now has what the kit already builds: over the behind signal's half second, `st.alpha=1-0.38*Math.sin(u*Math.PI)`, where `u` runs from 0 to 1. Everything else is unchanged: `hot`, the motes, and the fade out at 4.0 to 4.3 s. Check that the kit's `bsMove` behind uses the same formula over the same window.

The design system's own preview was measured: the boss's brightness now dips once, smoothly, and comes back. Version 8 swung up and down several times in the half second.

### 3. The moor's crow flocks

Dawn's two flocks are drawn a quarter of the way from `ink` towards Dawn's air: `mixc(INK,AIR[lv],0.25)`, about 31, 36, 48. Before, they were tinted as backdrop layer 2 (`tn[1]*0.9`, about 64, 77, 100). Only the flocks change: the near crows (`drawCrowsAlone`), the Mist's crows and the leaves keep their tints. The Flyers rule now names the flocks as the one exception to "coloured as the layer they fly in front of".

**For the kit:**
- Change it both in the kit's way and in the mock-up way, since 4c-1 draws the crows both ways.
- 4c-1 paints each crow wing position once, like the bats' 17. If the colour is painted into those pictures and the flocks share them with the near crows, the flocks need their own set in the new colour.

**Checked at phone size** (844 × 390 at 2.6×, Dawn with the flocks at the left, the middle and the right): they now read clearly as dark birds over the daybreak and over the blue alike. In version 8 they all but vanished from the middle rightwards. They are least distinct at the very top right, where the sky is darkest, but still clearly visible there, because the crows are near grey against blue.

### 4. The place list

`LV` now reads:
- `name`: Night, Blood Red Rain, Dawn, Mist;
- `place`: The Graveyard, The Old Town, The Open Moor, The Wind Bent Forest.

The descriptions name the places the same way. The Graveyard's description keeps "at the edge of the village"; the Mist's description doesn't name its place, so it is unchanged.

Bring the kit's copy of `LV` into line. Nothing a player sees uses it: the place card's words are `mv10.js`'s, already right. The Wanderer preview's labels read `name`, so its label for the old town now says "Blood Red Rain".

## Refresh the copy

An exact copy of version 9, laid out as `lantern-box/design-system/` should stand, is in `dist/lantern-box-design-system-9/`. Its checksums are in `dist/lantern-box-design-system-9.sha256`.

- **111 files**, as in version 8. Before staging it, the Claude app project checked that the repo copy matched the version 8 staging exactly.
- **8 files differ from version 8**:
  - `ABOUT-THIS-COPY.md`
  - `README.md`
  - `components/bundle.js`
  - `components/play.js`
  - `components/MonsterAttacks/README.md`
  - `components/BossAttacks/README.md`
  - `components/Flyers/README.md`
  - `components/Places/README.md`
- `tokens.css` is unchanged.

Check the staged copy against its checksums, copy it over `lantern-box/design-system/`, then check again in place. `git status` should then show only those 8 files in the copy.

## HANDOVER.md

- In "Where things are", the copy is now version 9 (`HANDOVER-design-9.md`).
- Mark "Notes for design system version 9" as done in version 9, pointing here. The note that the signal eyes are drawn only while frozen is superseded: see fix 1.
- The open item for 4d (a monster standing in front of the piece the wanderer stands on) stays open. It is not in version 9.

## Checks

- **The build and the console.** Both games build with no warnings, and the console is clean.
- **On the Pixel:**
  - the mouth-hat at rest and as it hops in, one pair of eyes;
  - the crawler and the flyer unchanged, including the flyer's eyes cooling after its dive;
  - the ghost's fade smooth;
  - the moor's flocks visible across the whole width;
  - Effects off and Reduce motion: with Reduce motion on, the hop uses `rm`'s smaller lift.
- **Speed.** No speed check is needed for these changes alone: one transform for each mouth-hat and a colour. The exception is if fix 3 means painting a second set of crow wing pictures; then glance at Dawn's frame time.
- **Say what you could not test.**

## Commit

Check in with Barney first, as always. One commit can carry the copy, this note, HANDOVER.md and the kit's changes for fixes 1, 3 and 4. Use the next CM number in HANDOVER.md's list. Stage named paths only. Never push.
