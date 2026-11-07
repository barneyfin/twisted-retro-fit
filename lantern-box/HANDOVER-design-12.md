# Lantern Box: handover for design system version 12 (Gloam Hallow ready for a portal)

This note hands design system version 12 to Claude Code for phase 5 of Gloam Hallow. It follows `HANDOVER-design-11.md`. Written 7 November 2026 in Barney's Claude app project, from the portal-readiness PRD (approved 7 November 2026) and step 5b's design rounds 1 to 3, each agreed by Barney.

**Barney approved version 12 on 7 November 2026**, after two fixes to the previews: the new screens' backdrops now show the current world, wanderer and HUD (they had step 4a's stills, with the old Veiled Ghost), and the Wanderer card shows the game's wanderer instead of the old stand-in. Step 5d starts next, and the kit moves to **0.10.0**.

The PRD is in his project as *Gloam Hallow: portal readiness PRD*. The checklist is `CRAZYGAMES-gloam-hallow.md` (refreshed with this note). The gameplay note (`GAMEPLAY-gloam-hallow.md`) has been updated to match; its copy from before this update is `dist/GAMEPLAY-gloam-hallow-before-phase5.md`.

## The plan for phase 5 in Claude Code

From the PRD, one commit and check-in each. The split between 5d and 5e below is a suggestion; Barney decides.

| Step | What | Check-in |
|---|---|---|
| 5d (kit 0.10.0) | Saved progress (sections 1 and 2); the rename and the echo sound (3); the run's end, with the daily bonus (4); the keys (5); Settings' Credits and Clear saved progress (6) | Barney plays it |
| 5e | The Echo Shrine and the choice of run (7); the new spells (8); three potions of each (9); the belts (10); the Graces (11); teaching in play (12); the win's three lines and the second loop (13) | Barney plays it |
| 5f | Balance against real runs; three to five people play it cold while Barney watches | Go or no-go |
| 5g | The CrazyGames build and the tests (section 15) | Every check passes |

## What changed, in short

| Change | Where in the design system | Kit or game | Step |
|---|---|---|---|
| Saved progress: one versioned record through the kit's one storage function | README (Settings), SettingsPanel, RunEnd | Kit (the store), then the game | 5d |
| Wisps become echo in every word on screen; the bank "Stolen echo"; the wisp shop the Echo Shrine | README, WispCounter, HighScores, NameEntry, TitleArch, TitleScreen, GameOverCard; `play.js` HUD; tokens' notes | Kit and game | 5d |
| The wisp's rising note becomes a short echo, louder by value | Sound; `play.js` `ECHO`, `FX.defeat`, `FX.echo`, `SND.play(k, v)` | Kit (sound) | 5d |
| The run's end replaces game over in Gloam Hallow | RunEnd (new); `bundle.css` version 12 section | Kit parts, game rules | 5d |
| P pauses, Backspace goes back; never Esc in a hint; the player's own key letters | README, Keycap, HowToPlay, PauseOverlay, MenuPanel, HighScores, HysteriaFinish, SettingsPanel | Kit | 5d (and 5g) |
| Settings: Credits, Clear saved progress and its confirmation | SettingsPanel, Credits (new); Brand asset | Kit and game | 5d |
| The Echo Shrine and the choice of run | EchoShrine (new), Modes | Game (kit parts as CSS) | 5e |
| The lightning bolt and the acid spray | Spells; `play.js` `fxBolt`, `fxAcid`, `fxAcidPatch` | Kit (effects), game (rules) | 5e |
| Up to three potions of each, pips under the sockets | Potions, HUD; `play.js` `setPotion`, `potCount`, `potCap` | Kit, then the game | 5e |
| Four belts | Wanderer; tokens `belt-night-blue`, `belt-mulberry`, `belt-ash`; `play.js` `BELTS`, `setBelt` | Kit | 5e |
| The Graces after each boss | GracePick (new) | Game (kit parts as CSS) | 5e |
| Teaching in play on a first run | Teaching (new) | Kit parts, game rules | 5e |
| The win's three lines and the second loop's offer | WinCard | Kit and game | 5e |
| No pit near a checkpoint | Checkpoint, Ground; `play.js` `LV_CP_CLEAR` | Nothing: kit 0.9.1 already does it | Check only |
| The Full Launch places, drawn only | AdPlaces (new), RunEnd, EchoShrine, GracePick | Nothing in phase 5 | Leave room only |

Versions: `play.js` 1.2.0, `bundle.js` unchanged (11.0.0), `tokens.json` version 12 (so `tokens.css` gains `--belt-night-blue`, `--belt-mulberry` and `--belt-ash`), `bundle.css` with a version 12 section at its end.

## 1. Saved progress (5d)

PRD question 1; ARCADE.md now allows saved progress and shops in any game (arcade decision A).

- **One versioned record**, read and written only through the kit's one storage function (`store` in `lantern-box/kit/lantern-box.js`, already wrapped so refused storage can't crash the game). Gloam Hallow never touches storage any other way. This keeps the later switch to CrazyGames' cloud save (Full Launch) a small change.
- **What it holds**:
  - the stolen echo;
  - what has been bought: potion sockets (health and mana, 1 to 3 each), the lightning bolt, the acid spray, the three belts, and later Hysteria;
  - the attack spell chosen and the belt worn;
  - whether the first run has been played, and whether the hints were hidden;
  - the furthest place reached (for "Furthest yet");
  - the date of the last doubled Echo Infusion run (the device's own date).
- **Give it a version number**, so a later change can read an older record. If a record can't be read, start afresh rather than stop.
- **Nothing about a run in progress is saved**: a run still always starts at Night.
- The shared settings and the high scores stay where the kit keeps them now.

## 2. Clear saved progress (5d)

SettingsPanel: Clear saved progress removes the record (Hysteria included), so the next run is a first run, hints and all. High scores and settings stay. Its confirmation ("Clear saved progress?") has Keep it as the primary button, focused, so Enter never clears by accident. Clear it is `lb-btn is-danger` (ember outline), the only destructive button in the game.

## 3. The rename and the echo sound (5d)

PRD question 12. Echo has no plural ("118 echo"). Only the words change; the look stays.

- **Words on screen**:
  - the HUD label ECHO (`HUD.build` writes it);
  - the run's end and the win: "echo" under the number;
  - the high-score column ECHO;
  - "1120 echo. Enter your initials.";
  - the title's "Best 0450 echo";
  - "Stolen echo", "Echo Shrine".
- **Screen readers** hear "450 echo" (the counter's aria-label).
- **Identifiers can stay**. The World's wisp is still a wisp (the pale wisp rises as before; `wisp-pale` and the other wisp tokens keep their names). `play.js` keeps the HUD state's key `wisps`. Rename in code only where it helps you.
- **The sound** (Sound, `ECHO` in `play.js`):
  - the soft rising note becomes a short echo: the same note (660 to 990 Hz), then two to four repeats 0.16 s apart, each half as loud, darker and further into the room;
  - louder and longer the more echo it gives: 1, 2 or 5 from a monster, 25 from a boss's golden wisp (a fifth lower);
  - `SND.play` now takes a value: `SND.play("defeat", v)` plays the card tear and the echo; `SND.play("echo", 25)` the echo alone, after `bossDefeated`'s bell;
  - `GAIN.echo` starts as `defeat`'s. Measure both as the rest were, and tune by ear.
  - Checked here, offline: the echo's loudness rises with the value (RMS 0.0075, 0.0088, 0.0109 and 0.0139 for 1, 2, 5 and 25).

## 4. The run's end (5d)

RunEnd (new) replaces GameOverCard's flow in Gloam Hallow. Its README has the rules; the preview has five states. In short:

- **Words**: "Game over" over "The rot overcomes you, but your echo remains." (Barney, PRD question 9).
- **The score**: this run's echo, large. Spending at the Echo Shrine never lowers a high score.
- **The near-miss line**, one of:
  - "Fell to {boss} · {bar} · {n}% left", when he fell in a boss fight;
  - "Furthest yet" with the place's name, when this run went further than any before;
  - nothing, when neither is true.
- **The next unlock**: the cheapest thing not yet bought, its picture, and "Next: {name}" with "{n} to go". The bar runs from 0 to its price: banked echo darker, this run's echo bright. When it can be bought, READY instead, the bar full, and the Echo Shrine button lit (`is-lit`). When everything is bought, leave the block out.
- **The daily bonus**: the first Echo Infusion run of each day earns double echo. Show the "×2 First Echo Infusion today: {n} echo stolen" line on that run only. It doubles that run's echo, never the stored total, and never applies to The Bare Reckoning. No streak.
- **Buttons**: Play again (primary, the diamond, focused) repeats the run just played; then Echo Shrine and Menu. High scores moves into Menu.
  - A top-ten score in The Bare Reckoning has only Continue, to the initials and the table.
  - The Echo Infusion is never on the high scores.
- **The very first run** (and the first after Clear saved progress): the line "Your echo stays with you when a run ends. Spend it at the Echo Shrine." and "Spend your echo" as the primary button. Only this once.
- **Timing**:
  - 0 to 0.8 s: the last life falls as now, but with no fade to black;
  - 0.8 s: the plaque appears;
  - 0.8 to 2.0 s: this run's echo steps into the bar and "to go" counts down; READY lights once with the `confirm` chime if an unlock is reached;
  - 1.0 s: the buttons take input, so a mashed jump can't skip the screen.
- **Before step 5e**, while the Echo Shrine doesn't exist yet, its button can wait, or open a placeholder. Barney decides.

## 5. Keys (5d; checked again in 5g)

- **P** pauses and resumes; **Backspace** goes back in every menu; **Enter** confirms; arrows choose.
- **No hint shows Esc**: CrazyGames keeps Escape for leaving full screen (its quality guidelines). The CrazyGames build must never listen for it. The arcade's own build may keep answering it, unshown, so nothing a player there knows stops working.
- Backspace must call `preventDefault`, so no browser treats it as "back a page".
- **Keyboard layout**: the game already binds keys by position (`event.code`). Where the browser has the Keyboard API (`navigator.keyboard.getLayoutMap()`, Chrome and Edge), keycaps and hints show the player's own letters: an AZERTY keyboard shows Z Q S D, A and E. Elsewhere, the letters as now.
- H hides the first-run hints (section 12).

## 6. Settings' new rows and Credits (5d)

- **SettingsPanel**: below Picture, one row shared by Credits (Open) and Clear saved progress (Clear), split by a hairline. The plaque is 560 wide on a computer (it was 500), 14 px from the top, parts 10 px apart, so it fits 540. On a phone, Credits goes under Reduce motion and Clear saved progress under Picture's note.
  - Round 3's notes for the two rows don't fit, so they're left out; the confirmation says what clearing does.
- **Credits** (new):
  - the studio's credit strip, 300 px wide (240 on a phone), alt text "Made by Lantern Box Games";
  - "Music made with Google Gemini", with The Long Vigil and Lantern in the Moor;
  - "Two sound effects from Pixabay; the rest made in code";
  - the two fonts, their designers and the SIL Open Font Licence;
  - Back.
- **The studio credit file** is the repo's `brand/svg/lbg-credit.svg`. Build it in once, as the soundtracks are (ARCADE.md's one exception to no image files and no hex colours). Never redraw or recolour it. The design system holds a copy only for its preview.

## 7. The Echo Shrine and the choice of run (5e)

- **EchoShrine** (new): three columns (the spell for the next run, the potions you can keep, the belt), the bank (STOLEN ECHO) top right, Hysteria locked underneath ("Coming soon · 500"), and the foot "Bought for good. The spell and belt can be changed here before any run." On a phone the spells' notes go and Hysteria moves into the foot.
- **Rules**:
  - anything affordable can be bought, in any order;
  - a third potion socket needs the second first;
  - a bought spell is chosen, and a bought belt worn, with one press;
  - every purchase is saved at once.
- **Starting prices** (tuned at 5f): second health socket 25, lightning bolt 75, night blue 100, second mana socket 175, mulberry 250, ash 250, acid spray 300, third health socket 350, third mana socket 400. 1,925 for all nine. Hysteria 500, not buyable until it is built.
- **The choice of run** (Modes, changed), headed "Choose a run": The Bare Reckoning, The Echo Infusion and Hysteria (locked), each with Barney's words and what it takes. It shows only once anything is bought; before that, Start game goes straight into The Bare Reckoning. On a phone the three sit side by side (new in version 12).
  - **The Bare Reckoning** (scored) takes the chosen spell and belt and one potion of each, whatever was bought.
  - **The Echo Infusion** takes everything bought.
  - **Play again** repeats the run just played.
- **Not designed yet: how the title menu reaches the Echo Shrine.** The PRD says "from the title menu and the run's end", but the arch holds four items (Start game, How to play, High scores, Settings), and no round drew a fifth. **Ask Barney before building it.** Until then the shrine is reached from the run's end.

## 8. The lightning bolt and the acid spray (5e)

Spells (version 12 section). A different effect, not more power; each costs the fireball's mana. All figures are *starting figures*.

- **Lightning bolt**:
  - strikes the nearest monster ahead at once (about 5 body-lengths), then forks to one more within about 2;
  - each hit about two-thirds of a fireball's;
  - `fxBolt`: a jagged gold line, 0.2 s, its corners zigzagging as sharply on the fork as on the strike;
  - one flash, on the bolt only, never the screen.
- **Acid spray**:
  - hits everything in a short cone (about 2 body-lengths), crawlers too;
  - leaves a patch that hisses for 1.5 s and hurts whatever walks through;
  - about a fireball's damage in all;
  - `fxAcid` (0.35 s) and `fxAcidPatch`;
  - gold, as every spell (`ACID_LOOK` "gold"; green stays one switch away).
- **The scrolls**: that run's scrolls teach the chosen spell; L or a tap switches between heal and it.
- **The review loops** `loopBolt` and `loopAcid` are the timing reference.
- **Barney's word**: the concept is agreed; the execution has to be good, so he judges both in play before they're tuned.
- **Speed**: Blood Red Rain is the tightest leg (22.8 ms against 25 on the Pixel). Measure a bolt and an acid patch there with a crowd, and report the figures.

## 9. Up to three potions of each (5e)

Potions (version 12 section), HUD.

- One socket per kind in the HUD, as now. Once a second socket is bought, pips under it: one per socket bought, filled while a potion is in it.
  - `lb-potion-pips`: 6 px diamonds, 5 px apart, 9 px under the socket, clear of a computer's keycap.
- `HUD.set` takes counts and capacities: `potions: {health: 2, mana: 1}` (true still means 1) and `potCap: {health: 3, mana: 2}`.
- **Rules**:
  - a potion picked up fills an empty socket;
  - when all bought sockets are full, it's drunk if needed, or left on the ground;
  - a drink drains the flask, and with one left it shows full again at once;
  - kept potions survive a lost life (Barney's answer for version 11, unchanged);
  - "Kept for later" shows once per kind each run, as now.
- **What each run takes**: The Bare Reckoning, one socket of each, whatever was bought; The Echo Infusion, every socket bought.

## 10. The belts (5e)

Wanderer, tokens. Red to start (`wanderer-scarf`, the token keeps its name); night blue `belt-night-blue` (#3d5cab), mulberry `belt-mulberry` (#94407f) and ash `belt-ash` (#8f877c), bought at the Echo Shrine. Barney checked all three on the Pixel.

- `play.js`'s `BELTS` and `setBelt(name)` set the colour the puppet draws (`MV_RED`, now `let`) and the stand-in (`W_RED`). The rolling ball's band follows too.
- `loopBelt` is the Wanderer card's check, not game code.
- In the kit, the belt is a colour on the drawn wanderer: name it from the tokens, never as hex in the game.
- **The old stand-in**: the kit still carries step 4a's `drawWanderer` (the scarf) for its scene's `walking` option and the boss sheets. The design system's Wanderer card now shows only the puppet. Wherever a game shows him, it must be the puppet, wearing the chosen belt; check the kit's pages that still use the stand-in and tell Barney what you find.

## 11. The Graces (5e)

GracePick (new). PRD question 7.

- **When**: after each of the first three bosses, as the next place's card comes up. The card holds, play stopped, for "Bind a twisted Grace": three cards drawn at random from the deck, never one already held. A pick lasts for that run only. Three picks a run, none before Night.
- **How**: a click or a tap on a card takes it; left and right choose, Enter takes. Then the card runs on as usual.
- **The deck**: Keen Edge (your sword bites deeper), Long Reach (reaches further), Deep Well (mana refills twice as fast), Iron Skin (start every place with full armour), Fleet Foot (rolls recover faster), Kindled Heal (heal restores more), Spell Surge (your attack spell costs less mana), Lantern Ward (the first hit in each place is ignored).
- **Pictures**: five of the eight are new in version 12 (Long Reach, Fleet Foot, Kindled Heal, Spell Surge, Lantern Ward). Use the design system's SVG paths as drawn.
- **Sizes not decided**: how much deeper, further, faster and less. Set starting values, mark them as such in the gameplay note, and tell Barney.
- **No Grace touches echo.**

## 12. Teaching in play (5e)

Teaching (new). CrazyGames' quality guidelines ask for onboarding inside play: skippable, mostly pictures, the controls on screen.

- **When**: on a first run, and again after Clear saved progress. Never in a later run.
- **On a computer**:
  - at the start of Night, a row above the path: A D walk, Space jump, J attack;
  - later, the first time each matters: K cast (once a spell is learnt), Shift roll, Q E drink (with the potion's plaque line);
  - "Hide hints" with the H keycap, bottom right.
- **On a phone**: the stick's half outlined ("Touch and drag here to move", "Flick to roll"); Jump and Attack ringed and named; "Cast, once a spell is learnt" fainter until then; "Hide hints" top middle (44 px).
- **Going**: a hint dims to 35% as soon as its control is used, then goes after a second. The next to learn is edged in `heading`. H or Hide hints hides them all for good (saved).
- **Never**: they never stop play, flash, or cover the HUD, the boss bar or the plaque line.

## 13. The win and the second loop (5e)

WinCard (version 12 section). The second loop is built before submission (PRD question 8).

- **The three lines**: "A grim triumph." (40 px), "The flesh yields." (21 px, `heading`) and "Gloam Hallow remembers not your suffering.". They appear one at a time, instantly, with the `win` sound's three bells at 0, 0.7 and 1.4 s.
- **Then the score**, and the lanterns counted in (from 2.6 s, half a second apart).
- **Then the offer**, from 3.6 s, when the buttons take input: Barney's line "Fell The Wandering Rot to begin anew—walk the cursed path once more against darker terrors.", over Go round again (primary) and Finish.
- **Finish** goes on as game over does: Continue to the initials for a top-ten score, otherwise the run's end's buttons.
- **"Hysteria unlocked" is gone**: Hysteria is bought at the Echo Shrine (after submission).
- **The second loop** as the gameplay note has it: the same run carries on at Night, harder, echo doubled, hill sections shuffled, "Again, harder" on its plaque line.

## 14. Already done: no pit near a checkpoint

Kit 0.9.1 leaves out any pit from 120 before a checkpoint to 320 after it (`LV_CP_CLEAR`; Barney, 5 November 2026). Your note for version 12 asked the design to follow, and it now does: `play.js`'s `lvTerrain` filters the same way.

Checked here: three pits each in Night, Blood Red Rain and Dawn, four in the Mist, as your 0.9.1 note says. Nothing to change in the kit.

## 15. The CrazyGames build (5g)

From the PRD and the checklist; the design system adds only the keys (section 5).

- **Take out**:
  - the full-screen tile, on the title and in play;
  - the Testing panel;
  - arcade links.
- **Order the file** so the soundtracks come last and play starts before they arrive (check first whether the game waits for them now).
- **Test** on the computer's browsers, the Pixel and the tablet, at 60, 144 and 165 Hz, and in a private window.
- **Not in phase 5**: the SDK, ads, cloud save and the CrazyGames username.

## Not in phase 5: the Full Launch places

AdPlaces (new). Drawn now, built only if CrazyGames invites the game:

- the revive (once a session, The Echo Infusion only);
- double this run's echo (the run's end);
- try a spell for one run (the Echo Shrine);
- a second Grace (the Grace pick);
- a banner under the Echo Shrine.

Leave the room they need. Build none of them, and load no SDK.

## Questions for Barney before building

1. **The title menu's way to the Echo Shrine** (section 7): a fifth item in the arch, or another way. Not designed.
2. **The Echo Shrine button before 5e** (section 4): leave it out until 5e, or a placeholder.
3. **The step split** in "The plan for phase 5" above.

## Refresh the copy

An exact copy of version 12 is in `dist/lantern-box-design-system-12/`, with checksums in `dist/lantern-box-design-system-12.sha256`. The list of files that differ from the repo's version 11 copy is in `dist/lantern-box-design-system-12-changed.txt`.

The copy leaves out the stills, as before. It also leaves out the Brand group's SVG: the repo's `brand/svg/lbg-credit.svg` is the source. Only the group's README is in `assets/Brand/`.

Steps:
1. Check the staged copy against its checksums.
2. Copy it over `lantern-box/design-system/`.
3. Check again in place.

`git status` should then show only those files in the copy (this note, the gameplay note and the checklist are already committed, as CM101).

In `HANDOVER.md`, "Where things are", the copy is now version 12 (add `HANDOVER-design-12.md`).

## Checks

- **The build and the console**: every Lantern Box game builds with no warnings, and the console is clean.
- **The arcade build plays as before**, apart from the new features: same inputs, same game state (PRD "No hidden changes").
- **Saved progress**:
  - survives a reload;
  - a private window plays without saving and never crashes;
  - Clear saved progress brings back a first run, hints and all, and keeps the high scores and settings.
- **Keys**:
  - P and Backspace everywhere;
  - no hint shows Esc;
  - Backspace never leaves the page;
  - on an AZERTY layout the keycaps read Z Q S D.
- **On the Pixel**:
  - the run's end, the Echo Shrine, the choice of run, the Grace pick, Settings and the win each fit 390 points of height;
  - every target is at least 44 px;
  - the belts show against the dark places;
  - the pips are readable.
- **Speed**: the bolt and the acid in Blood Red Rain with a crowd, within the Pixel's limit.
- **Say what you could not test.**

## Commit

Barney commits this note, the gameplay note and the checklist himself (CM101) when he approves version 12. After that, check in with him first, as always:
- the refreshed copy can be its own commit or go with step 5d's; Barney decides;
- use the next CM number in HANDOVER.md's list;
- stage named paths only;
- never push.
