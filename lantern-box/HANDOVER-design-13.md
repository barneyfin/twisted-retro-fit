# Lantern Box: handover for design system version 13 (what building step 5e found)

This note hands design system version 13 to Claude Code. It follows `HANDOVER-design-12.md`. It was written on 7 November 2026 in Barney's Claude app project, from Claude Code's brief after step 5e (kit 0.15.0) and Barney's answers to it.

**Barney approved version 13 on 7 November 2026**, after settling every question it raised: the strong Graces' names and lines, the tier words on the cards (Frail, Potent, Malignant), all five new commons, the second loop's win words and the crowned headstone for High scores. Nothing is left open.

The gameplay note (`GAMEPLAY-gloam-hallow.md`) has been updated to match. Its copy from before this update is `dist/GAMEPLAY-gloam-hallow-before-13.md`, and it is also in git at commit 93bfa3c.

## Where it fits

Version 13 lands between 5e and 5f. It suggests one more building step before Barney plays for balance, called **5e-6 (kit 0.16.0)** here. Its name and how it is split are Barney's to decide.

| Step | What | Check-in |
|---|---|---|
| 5e-6 (kit 0.16.0) | Sections 1 to 9 below | Barney plays it |
| 5f | Balance against real runs; three to five people play it cold | Go or no-go |
| 5g | The CrazyGames build and the tests (`HANDOVER-design-12.md`, section 15) | Every check passes |

## What changed, in short

| Change | Where in the design system | Kit or game | Section |
|---|---|---|---|
| Armour: a glint across the pips on a hit, no shards; the pips crack in turn only as the last life goes; a full set leaves armour on the ground | HUD, Vitals (new close-up "Armour at the run's end"), Moments, Moves, Loot; `play.js` `HUD.set` (`armGlint`, `armEnd`), `CL.armourEnd`, `loopLost` | Kit (HUD), game | 1 |
| The title arch reads Start game, How to play, Echo Shrine, Settings; High scores is an arch tile | TitleArch, TitleScreen, ArchTile (three icons), HighScores | Kit | 2 |
| Graces by tier (common 76%, rare 20%, strong 4%), with the tier shown on the card | GracePick; `bundle.css` (`.lb-grace.is-rare`, `.is-strong`, `.tier`); tokens `grace-strong`, `grace-strong-glow` | Kit (CSS), game (the draw) | 3 |
| Three strong Graces: The Grave Refuses, Reverberate, Marrow Feast | GracePick, Moments, PlaqueLine | Game | 3 |
| Five new commons: Quick Hands, Full Draught, Grave Robber, Steady Heart, Mana Thief | GracePick | Game | 3 |
| Lantern Ward's ignored hit: a gold flare, a ring of motes, a chime | GracePick, Moments, Sound; `play.js` `fxWard`, `loopWard`, `FX.ward` | Kit (effect, sound), game | 3 |
| The Graces held on the pause screen; a Grace bound on the plaque line | PauseOverlay, PlaqueLine; `bundle.css` (`.lb-held…`) | Kit (CSS), game | 3 |
| A scroll for the run's attack spell on the path in Night | Loot, Spells, Teaching | Game | 4 |
| The bolt's and the acid's own sounds and scrolls; the acid's patch along slopes | Spells, Sound, Loot; `play.js` `FX.bolt`, `FX.acid`, `FX.acidHiss`, `lootShape`, `lSpellPic`, `fxAcidPatch(…, gy)` | Kit | 5 |
| The wisp's echo louder and after the tear; a game-over toll | Sound; `play.js` `ECHO_VOL`, `FX.defeat`, `FX.gameOver` | Kit | 6 |
| The run's end: the phone's two-line near miss, Furthest yet, the ×2 on a phone, a belt as the next unlock | RunEnd; `bundle.css` (`.lb-near.is-two`, `.lb-next-belt`) | Kit (CSS), game | 7 |
| The win: the echo stolen, the card after Finish, the second loop's win in Barney's words | WinCard | Game | 8 |
| The second loop: "Again, harder" on its place cards, section A first, Graces carried | PlaceCard, Moments; `bundle.css` (`.lb-card-again`) | Kit (CSS), game | 9 |
| Settings 27px from the top on a computer | SettingsPanel | Kit | 10 |
| Confirmed as built: the teaching timings, no drink hint on a phone, the hint row at 120/540, buying chooses or wears at once | Teaching, EchoShrine | Nothing to change | 10 |

`play.js` is now 1.3.0. Its header lists the changes. Every new number is a *starting figure* unless it says otherwise.

## 1. Armour (Barney's decision, folded in)

The kit already keeps armour all run, from kit 0.10.2. What's new is how it looks:
- **A hit with armour** shows the usual ember sparks, plus one brass glint passing across the pips held: 0.06 s apart, 0.3 s each (`HUD.set`'s `armGlint`, in seconds since the hit). Each pip takes 10% off the hit. There's no crack and no card shards for a hit any more, so take them out.
- **As the last life goes**, the pips crack in turn, the last first, 0.12 s apart, 0.4 s each (`armEnd`, in seconds since the last life went), with his card pieces. This comes before the run's end's plaque at 0.8 s. The armour crack sound plays here only.
- **An armour piece found with all three pips full** stays on the ground, as a potion does when its sockets are full.
- **Iron Skin** keeps its line and fills all three pips at each place's start, as already built.

## 2. The title arch and the High scores tile (Barney's decision, folded in)

The arch reads Start game, How to play, Echo Shrine, Settings. **High scores is the first arch tile**, left of sound, so sound and full screen keep their places from the right. It opens HighScores, and Back returns to the title with the tile focused. The tiles are reached with Tab, as before.

**The icon is the crowned headstone** (Barney's choice): a headstone with two engraved lines under a small crown, 2px strokes in a 24-unit box like the other tiles; its SVG is in the ArchTile and TitleScreen previews. It replaces the kit's podium stand-in.

## 3. The Graces

**Tiers replace the weights.** Each of the three cards in an offer first rolls its tier, then a card of that tier at random:
- common 76%;
- rare 20%;
- strong 4%.

All three figures are starting figures.

Never offer a card already held. Never offer a second strong Grace in a run: a strong roll after one is taken counts as rare. Every card in a tier has the same chance.

| Tier | On the card | Cards |
|---|---|---|
| Common | Frail | Keen Edge, Long Reach, Fleet Foot, Kindled Heal, Spell Surge, Quick Hands, Full Draught, Grave Robber, Steady Heart, Mana Thief |
| Rare | Potent | Iron Skin, Lantern Ward, Deep Well |
| Strong | Malignant | The Grave Refuses, Reverberate, Marrow Feast |

With these figures, a strong Grace is offered in about one run in three. Strong Graces come in both runs (Barney).

**The tier shows on the card** as a word at the top of every card. The words are Barney's (7 November 2026):
- **Common: Frail**, in `text-3`; otherwise the card looks as before.
- **Rare: Potent**, in `brass`, with a double brass edge (`lb-grace is-rare`).
- **Strong: Malignant**, with a `grace-strong` edge, softly lit corners (`grace-strong-glow`), and its picture, name and word in `grace-strong` (`is-strong`).

Every card's top padding is now 24px (20 on a phone), to hold the word. Nothing flashes.

**The strong Graces.** Their names and lines are Barney's, and final. Their pictures are on the GracePick card. None touches echo.

| Grace | Effect (*starting figures*) | Line |
|---|---|---|
| The Grave Refuses | Once a run, instead of losing a life he rises where he stood, with half health and the second of safety. His card pieces gather back instead of scattering, no lantern gutters, and the plaque line reads "The grave refuses you". Then it's spent. | "When you fall, you draw breath once more." |
| Reverberate (was Doubled Curse) | The attack spell repeats 0.15 s later, aimed the same way, for the same mana | "The incantation kisses twice." |
| Marrow Feast (was Echo Hunger) | Each monster defeated gives back 4% health; a boss 25% | "Replenish from the newly dead." |

**Five new commons.** Barney asked for more commons, to dilute the deck, and took all five proposed. The deck is now 10 common, 3 rare and 3 strong. Their lines and pictures are on the GracePick card; none touches echo.

| Grace | Effect (*starting figures*) |
|---|---|
| Quick Hands | Sword recovery 15% shorter |
| Full Draught | Each potion restores 40% more |
| Grave Robber | Monsters drop loot half as often again |
| Steady Heart | The second of safety lasts 1.5 s |
| Mana Thief | Every defeat restores 5% mana |

**Lantern Ward's ignored hit**:
- the lantern flares gold;
- a ring of ten gold motes opens from it (`fxWard`, 0.6 s);
- the ward chime plays (`SND.play("ward")`);
- no damage and no knockback;
- then the second of safety's slow pulse, as after any hit.

With Reduce motion, the motes stay put and fade. With Effects off, there's no glow. `loopWard` is the reference.

**Showing the Graces held**:
- **On the pause screen**, under the plaque: the flag "Graces bound", then up to three chips, each with its picture and name, in the order bound (`lb-held-list`, `lb-held-item`). A strong one is outlined in gold. A spent Grave Refuses stays listed at half opacity (`is-spent`). The row is hidden before the first boss.
- **On the plaque line**, as play resumes after the pick: the Grace's picture and "{name} bound" (agreed by Barney).

**The second loop**: the three Graces held carry on, with no new picks (already built).

## 4. The scroll on the path (Barney's choice)

Once a run, a scroll for the run's attack spell lies on open ground in Night's section B, about 40% of the way through the place, never beside a pit. What it teaches and where it lies are starting figures.

It's an ordinary scroll: the usual pulse, the usual line ("Fireball mastered", or the bolt's or the acid's), and the cast hint follows on a first run. It isn't placed again on the second loop.

Why: Barney had never had a spell in his playthroughs. Scrolls otherwise come only from walkers, who join at Dawn, and from bosses. Barney kept the Echo Shrine's order and prices as they are.

## 5. The lightning bolt and the acid spray

- **Their own sounds**:
  - `bolt`: a sharp crack, a buzzing zap, then a smaller crack as it forks, 0.06 s later.
  - `acid`: a wet hissing spray.
  - `acidHiss`: the patch's quiet bubbling hiss, for its 1.5 s.

  They're measured as loud as the fireball. The `GAIN` values are in `play.js`.
- **Their scrolls** are drawn for the scroll (`lootShape`, `lSpellPic`): the bolt as a solid zigzag, the acid as a spray of three lines with three drops. The kit shrinks the Echo Shrine's pictures instead; replace that.
- **The acid's patch follows the ground**: `fxAcidPatch(c, x0, x1, y, k, u, look, gy)`, where `gy(x)` is the ground's height at x. On a slope the patch, its bubbles and its motes follow the ground (`loopAcidSlope`).

## 6. Sound

- **The wisp's echo** plays at its own level (`ECHO_VOL` 0.2), about 4 to 8 dB over the card tear. In a defeat it starts as the tear ends, at 0.28 s (it was 0.18 s). Kit 0.10.1 already raised its level. Match the timing, and check the level by ear against the Sound card.
- **Game over**: one low, muted toll (`gameOver`) as the run's end's plaque appears at 0.8 s, after the lost life's falling tones. It's measured as loud as the place card's toll.
- Measured levels, over each sound's loudest 0.4 s:

  | Sound | Level |
  |---|---|
  | Fireball | −28 |
  | Bolt | −28.7 |
  | Acid | about −27 |
  | Plaque line and ward | −31.9 |
  | Place card | −25.2 |
  | Game over | −26.9 |
  | Monster defeated (1 echo) | −27.1 |
  | A boss's 25 | −23.4 |

## 7. The run's end

- **On a phone, the near-miss line is always two lines**, for every boss and every share left (`lb-near is-two`, with a break after the name): "Fell to {boss}", then the bar and "{n}% left". It fits 390.
- **Furthest yet**: as built, `lb-ready` beside the place's name.
- **The ×2 line on a phone**: as built, in the left column under the near-miss line.
- **A belt as the next unlock**: the belt's band in its colour in a 44px box (`lb-next-belt`), with "Next: Mulberry belt". Barney is happy with the band.
- **The game-over toll** (section 6).

## 8. The win

- **The echo stolen**: after the lanterns are counted (3.3 s), "{n} echo stolen" (`lb-daily lb-stolen`). On the day's first Echo Infusion run it carries the ×2 mark and the doubled figure. It's never doubled in The Bare Reckoning.
- **After Finish**, as built, the offer gives way at once to the run's end's buttons: Play again (primary, focused), Echo Shrine and Menu. A top-ten score gets Continue alone. The lines, the score and the echo stolen stay. Enter plays again; Backspace goes to the menu.
- **The second loop's win**, as built, has no offer, and the end buttons appear at 3.6 s. **Its three lines are Barney's** (7 November 2026), in place of the first loop's, with the same bells and timings (0, 0.7, 1.4 s):
  - "A monstrous glory." (the heading, `is-win`);
  - "The greater horrors have bled dry." (`lb-win-line is-lead`);
  - "Gloam Hallow now fears your tread."

## 9. The second loop

- **The place cards** show "Again, harder" under the place's name, above the rule (`lb-card-again`: 13px, 600, spaced capitals in `brass`; 12px on a phone), on all four cards from Night's. It replaces the plaque line "Again, harder". Nothing on the HUD.
- **Each place opens with its own section A**; only the sections after it are shuffled. Keep "no section twice running".
- The harder figures stay as built (starting figures for 5f): monsters take 1.5 times the hits and move 1.2 times faster, bosses have 1.5 times the health, and echo is doubled.

## 10. Smaller things

- **Settings** on a computer is centred and 27px from the top, as built. The preview now matches.
- **Confirmed as built, so nothing to change**:
  - Teaching's timings: roll at a monster's first attack within 400, drink when the first potion is kept;
  - no drink hint on a phone;
  - the computer's hint row at 120/540 of the window's height;
  - at the Echo Shrine, a spell or belt bought is chosen or worn at once.
- The title, pause, Grace pick and run's-end previews now draw their backdrops live from `play.js`, as version 12's did.
- The title screen preview's hidden version 8 alternative is gone.

## Still open with Barney

Nothing. Everything settled with him after the first draft of this note: the High scores icon (the crowned headstone); the strong Graces' lines, with Reverberate and Marrow Feast renamed (they were Doubled Curse and Echo Hunger); all five new commons; the second loop's win words (section 8); the tier words Frail, Potent and Malignant; "{name} bound" on the plaque line; the look of The Grave Refuses saving him; and where the scroll on the path lies.

## Refresh the copy

A full copy of version 13 is in `dist/lantern-box-design-system-13/`. It is the repo's version 12 copy with version 13's changed files over it. Its checksums are in `dist/lantern-box-design-system-13.sha256`, and the files that differ from version 12 are listed in `dist/lantern-box-design-system-13-changed.txt`.

Two files are refreshed here rather than in the artifact:
- `tokens.css` is version 12's with `--grace-strong` and `--grace-strong-glow` added after `--brass-wash`;
- `ABOUT-THIS-COPY.md` describes version 13.

The stills and the Brand SVG are left out, as before.

Steps:
1. Check the staged copy against its checksums.
2. Copy it over `lantern-box/design-system/`.
3. Check again in place.

`git status` should then show only the changed files in the copy. In `HANDOVER.md`, "Where things are", the copy is now version 13 (add `HANDOVER-design-13.md`).

## Checks

- **The build and the console**: every Lantern Box game builds with no warnings, and the console is clean.
- **Nothing else changes**: same inputs, same game state, apart from the items above.
- **Armour**:
  - a hit with three pips takes 30% off, glints, and loses no pip;
  - a lost life keeps the pips;
  - the last life cracks them in turn;
  - a full set leaves the pick-up on the ground.
- **The Graces**:
  - over many simulated runs, a strong Grace is offered in about a third of runs and never twice in one;
  - The Grave Refuses saves him once a run only;
  - Reverberate costs no extra mana;
  - Marrow Feast never heals above full.
- **The scroll on the path**:
  - it is in every run's Night, first runs included, never beside a pit;
  - it is not there on the second loop;
  - with the bolt or the acid chosen, it teaches that spell.
- **On the Pixel**:
  - the Grace pick with a strong and a rare card, the pause screen with three Graces, the run's end with the two-line near miss and ×2, and the win with the echo stolen and after Finish, each fit 390 points of height;
  - every target is at least 44px.
- **Sound**: the echo is heard clearly after the tear; the toll doesn't clash with the lost life's tones.
- **Say what you could not test.**

## Commit

Barney commits this note and the gameplay note himself (CM102) when he approves version 13. After that, check in with him first, as always:
- the refreshed copy can be its own commit or go with step 5e-6's; Barney decides;
- use the next CM number in HANDOVER.md's list;
- stage named paths only;
- never push.
