# Lantern Box: handover for design system version 11 (potions kept for later)

This note hands design system version 11 to Claude Code. It follows `HANDOVER-design-10.md`. Written 5 November 2026 in Barney's Claude app project, from round 13, which came out of his second play of Gloam Hallow in step 4d and your notes a to e. Barney agreed it all ("All as agreed").

**The kit moves to 0.9.0** for the potion sockets, which are new kit work. Gloam Hallow then uses them.

## What changed, in short

| Change | Where in the design system | Kit or game? |
|---|---|---|
| One health and one mana potion kept for later, in two sockets under the plaque, drunk with a tap, Q or E; their "kept" and "drunk" moments; a new drink sound | Potions (new), HUD, Vitals, Loot, HowToPlay, Sound; `play.js` `hud13.js`, `pot13.js`, `snd13.js` | Kit 0.9.0, then the game |
| The plaque line (and the boss's name plaque) moves under the HUD's top row: 99 px down on a computer, 89 on a phone | PlaqueLine; `bundle.css` | Kit |
| The double tap to roll, Barney's kit 0.8.2 trial, is now in the design system | TouchControls, HowToPlay | Already in the kit: check only |
| Lit through a cloud gets a soft edge, and the far layers go only 0.55 of the way | Places, Flyers; `bundle.js` 11.0.0; tokens `thru-cloud-soft`, `thru-cloud-far` | Kit |
| The ghoul lurches about 30 forward as it swipes, so its reach (about 114) beats the sword's (about 84) | MonsterAttacks; `play.js` `MO_DUEL.ghoul` | Game (or the kit, if the duel lives there) |
| The walker's high sweep stays as drawn; its rule is now "arms up: stay down (don't jump), or roll" | MonsterAttacks, Monsters | Game: check the hit test |
| The Gaping Tree's long branch sweeps at head height all the way out | BossAttacks; `play.js` `bsBranchPts`, `BS_FIGHT.mist`, `bsBranchFx` | Game (or the kit) |
| Monsters face the wanderer in a game (your step 4d choice), recorded | Monsters, MonsterAttacks | Nothing: already done |

Versions: `play.js` 1.1.0, `bundle.js` 11.0.0, `tokens.json` version 11 (so `tokens.css` gains `--thru-cloud-soft: 9px` and `--thru-cloud-far: 0.55`). The gameplay note (`GAMEPLAY-gloam-hallow.md`) has been updated to match; its round 12 copy is in `dist/GAMEPLAY-gloam-hallow-before-round13.md`.

## 1. The potion sockets (kit 0.9.0)

**What the player sees** (Potions README):
- Two sockets of their own, 8 px under the plaque's left end, 8 px apart: health, then mana, each under its own bar. 40 px on a computer, 44 px on a phone. They sit in the stick's half of a phone screen.
- **Empty**: a faint outline of the potion and its mark in `brass-dim`, the socket's edge `brass-deep`.
- **Kept**: the round flask with the heart, or the tall vial with the flame; ink glass with a `heading` edge, the liquid in the bar's own colours; the socket's edge `brass`.
- **Kept while its bar is full**: dimmed to 38%, edge `brass-dim`. It can't be drunk then.
- **Computer only**: a Q or E keycap on each socket's lower right corner (Alegreya Sans bold 12 px), lit in `heading` while its potion is drunk.

**The code to port** is `hud13.js` in `play.js` (it replaces `hud10.js`) and the version 11 block at the end of `bundle.css`:
- `POT`: the shapes (glass, the liquid's clip, the top of the liquid, the mark).
- The SVG defs: clip paths `lbPotH` and `lbPotM`, gradients `lbLiqH` and `lbLiqM`.
- `potion(k, phone)` and `potions(phone)`: the markup. `.lb-hud-left` now holds the plaque and `.lb-potions` in a column.
- `setPotion(button, state)`: the classes `has-potion`, `is-topped` and `fx-off`, the aria-labels, and the two moments' HUD side:
  - **kept**: the flask grows from 0.6 to full and fades in, then one glint passes over it (0.4 s in all);
  - **drunk**: the liquid drains (0.35 s), leaving the outline.
- `HUD.set` takes `potions: {health, mana}` and `potFx: {k, kind: "keep"|"drink", u}`. `HUD.OPTS.rm` and `HUD.OPTS.fxOff` pick the Reduce motion and Effects off versions.

**The world's side** is `pot13.js` (new):
- `potFlight`: a kept potion lifts and arcs up to its socket, shrinking from 1.25 to 0.75 and fading over the last 15%, in 0.45 s. It is drawn over everything, as the HUD is. `potSocketAt` finds the socket's centre in picture units from the HUD laid over the canvas; the kit will have its own way to know where its socket is.
- `potDrinkFx`: 10 motes in the potion's colour rise round his chest, with a soft glow (0.9 s). The bar fills over 0.4 s.
- **Reduce motion**: no flight (the potion fades where it lay as the socket fades in), and the motes stay put and fade.
- **Effects off**: no glows; the motes stay.
- `loopPot` is the review loop: the reference for the timings, not game code.

**What the kit needs to offer the game** (name it the kit's way):
- show and set both sockets, including dimmed when the bar is full;
- play the "kept" moment from a point in the world to the socket, and the "drunk" moment at his chest;
- tell the game when a socket is tapped. On a phone a tap on a socket must never start the stick, as the spell socket already works;
- route Q and E to the game on a computer;
- the drink sounds (below).

**The plaque line for a first potion**: "Kept for later. Tap to drink" on a phone; "Kept for later. Q to drink" or "Kept for later. E to drink" on a computer. The pictures are `ICON.potH` and `ICON.potM`.

**Sound** (`snd13.js` replaces `snd12.js`): `drinkHealth` and `drinkMana`, from `DRINK(chord)`: the cork, two quick swallows, then a short warm chord rising (349, 440 and 523 Hz for health; 587, 740 and 880 for mana). `GAIN` is 2.37 and 2.36, measured like the heal (−31). Everything else in the sound is unchanged.

**How to play**:
- On a computer, two more key rows: Q, drink a health potion; E, drink a mana potion. The plaque is 650 wide (it was 560).
- On a phone, one more row with the two sockets drawn small: "Tap a potion, top left, to drink it". The left thumb's line now ends "flick or double tap to roll". The plaque is 720 wide (it was 700). The CSS is `.lb-touchkey svg .pk` and `.pf` in `bundle.css`.
- The preview shows both.

## 2. The plaque line's new place (kit)

`.lb-line` moves from level with the plaque to under the HUD's top row, centred: `top: 99px` on a computer and `89px` on a phone. The boss's name plaque is the same element, so it moves with it.

Why: on a phone the longer lines overlapped the plaque ("Fireball: glows brighter" by 9 px, "Sword: reaches beyond" by 6). Now no line meets the plaque, the sockets or the tiles at any width.

The kit adds a phone's safe margin to the HUD, so add the same to the line.

## 3. The double tap (check only)

The design system now has Barney's kit 0.8.2 trial as it stands:
- two short, still taps of the left thumb, each under 0.25 s and moving under 14 px;
- the second within 0.3 s and 70 px of the first;
- it rolls him the way he faces. The flick still rolls.

These match `TAP_MS`, `TAP_PX`, `DTAP_MS` and `DTAP_PX` in kit 0.8.2, so nothing changes. If you have tuned them since, tell Barney, and the design system follows.

## 4. Lit through a cloud, softened (`bundle.js` 11.0.0)

What Barney saw: a far tower only partly in front of a cloud was two-toned, dark above the cloud's edge and pale below, so it read as one tower showing through another.

Version 11 keeps version 10's rule and changes two things:
1. **A soft edge.** The clouds' band picture (`CF`) is drawn from copies of the clouds blurred by `CLOUD_SOFT` = 9 picture lines (times the cloud scale). The copies are made once, when the clouds are made (`cl0b`, `cl1b` in `Scene.ensure`), and drawn twice, so a thin cloud tail still darkens. The band is `2 × CLOUD_SOFT` (18 lines) taller, so the blur's lower edge is kept.
2. **Half as dark for the far layers.** Layers 1 and 2 lay their lit-through picture over the scene at `globalAlpha = FAR_THRU` (0.55). The far bat swarm still goes all the way, with the same soft edge.

`blurCopy(canvas, r)` uses the canvas `filter` where the browser has one. Where it doesn't (older Safari), it shrinks the copy by about `r` and grows it back, which comes within 20 levels of the filter version. Test it on the iPhone if you can, or say you couldn't.

Checked here: the new frames match the version Barney approved (round 13, option "soft edge and half"), pixel for pixel, in six test frames across Night, Blood Red Rain, Dawn and the Mist.

**For the kit**: the same three steps as version 10, with three changes:
- blur the cloud tiles once when you make them;
- extend the band by 18 lines;
- draw layers 1 and 2's overlay at 0.55.

**Speed**: the blur is made once, so the per-frame cost is only the taller band and drawing the blurred clouds into it twice. Measure Night and Blood Red Rain on the Pixel before and after, as for version 10, and report the figures. If it costs too much, tell Barney before cutting anything (for example, drawing the blurred copy once instead of twice).

## 5. The monsters

- **The ghoul's lurch** (`MO_DUEL.ghoul` in `play.js`): as it swipes, it now lurches about 30 forward (it was 8) and stays there through its recovery (`X = wx + 168 − 30·v`, then `wx + 138`). The arm (`moSwipe`) is unchanged. Its swipe reaches about 114 from where it stood, against the sword's 84, as the gameplay note says it should. The swipe's hit test must move with it. The way to beat it is unchanged: roll through under it, then strike while it recovers, close to him.
- **The walker**: no change to the drawing. The high sweep (arms up) passes over the wanderer standing: it catches him jumping or up on a piece. So arms up means stay down (don't jump), or roll; the low sweep (a crouch, arms back) means jump. Check that the game's hit test matches: the high sweep must not hit him standing on the ground. Lowering the sweep would need a stooping pose, which Barney turned down.
- **Facing**: recorded only. Monsters face the wanderer in a game, as you built in step 4d. The design system draws them facing left.

## 6. The Gaping Tree's branch

`bsBranchPts` now grows the branch from 84 above the tree's foot (it was 96). The branch is nearly level and still elbowed: its bends are +0.18 and −0.28 (they were +0.42 and −0.36). The swing ends at −3.20 (it was −3.05), in three places:
- the sweep in `BS_FIGHT.mist`;
- the retract;
- the trail in `bsBranchFx`.

Across its whole reach it is now 71 to 84 above the ground, against the wanderer's 100 to his hat. So a roll passes under it everywhere, and a jump takes him into it. Before, it passed over him more than about 120 from the trunk. The timing is unchanged, and the hit test should follow the branch's points.

## 7. Then Gloam Hallow

The rules of play, from the Potions README and the gameplay note:
- A potion picked up goes into its socket if that is empty. If the socket is full, the potion is drunk if he needs it, and left on the ground for later if he doesn't.
- A socket can't be drunk while its bar is full.
- Drinking is instant, with no pose, so it works mid-fight. It refills by `POTION.health` (0.35) or `POTION.mana` (0.5), as now.
- The scenery potions behave the same.
- The first-time plaque line, once per kind.

The gameplay note's drop rates now read 1 in 12 for each potion. That matches your halving in the game (Barney, 5 November 2026); the note still said 1 in 6.

**Two things the design system doesn't settle. Ask Barney before building them:**
1. Do kept potions survive a lost life? (A lost life keeps spells and sword upgrades and loses the armour.)
2. "Once per kind": once per run, or only the first time ever on that device?

## Refresh the copy

An exact copy of version 11 is in `dist/lantern-box-design-system-11/`, with checksums in `dist/lantern-box-design-system-11.sha256`. It holds 113 files: version 10's 111 plus the new Potions README and preview.

Against the repo's copy as it stands (version 10), 23 files differ:
- `ABOUT-THIS-COPY.md`
- `README.md`
- `tokens.json`
- `tokens.css`
- `components/bundle.css`
- `components/bundle.js`
- `components/play.js`
- `components/BossAttacks/README.md`
- `components/Flyers/README.md`
- `components/HUD/README.md`
- `components/HowToPlay/README.md`
- `components/HowToPlay/preview.html`
- `components/Loot/README.md`
- `components/MonsterAttacks/README.md`
- `components/Monsters/README.md`
- `components/Places/README.md`
- `components/PlaqueLine/README.md`
- `components/PlaqueLine/preview.html`
- `components/Potions/README.md` (new)
- `components/Potions/preview.html` (new)
- `components/Sound/README.md`
- `components/TouchControls/README.md`
- `components/Vitals/README.md`

Steps:
1. Check the staged copy against its checksums.
2. Copy it over `lantern-box/design-system/`.
3. Check again in place.

`git status` should then show only those files in the copy, plus `GAMEPLAY-gloam-hallow.md` and this note.

In `HANDOVER.md`, "Where things are", the copy is now version 11 (add `HANDOVER-design-11.md`).

## Checks

- **The build and the console.** Every Lantern Box game builds with no warnings, and the console is clean.
- **On a computer:**
  - Q and E drink, and do nothing while the bar is full or the socket is empty;
  - the keycaps light while drinking;
  - How to play's two new rows each fit on one line.
- **On the Pixel:**
  - a tap on a socket drinks and never starts the stick;
  - the double tap still rolls, and a quick tap-tap near a socket doesn't roll;
  - the plaque line and the boss's name sit under the HUD's top row, clear of the plaque and the sockets;
  - at Night, a far tower partly in front of a cloud reads as one tower, a little darker where the cloud is behind it, with no hard edge;
  - the swarm is as version 10;
  - Blood Red Rain's spires;
  - Dawn and the Mist unchanged.
- **Reduce motion and Effects off**: both moments, in each.
- **The ghoul** outreaches the sword. **The walker's** high sweep misses him standing. **The tree's branch** is rolled under everywhere and hits a jump.
- **The speed figures**, as above.
- **Say what you could not test.**

## Commit

Check in with Barney first, as always:
- Kit 0.8.2's commit (CM92) is still waiting. Barney decides the order and whether this refresh is its own commit before kit 0.9.0.
- Use the next CM number in HANDOVER.md's list.
- Stage named paths only.
- Never push.
