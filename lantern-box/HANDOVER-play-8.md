# Lantern Box: handover for design system version 8 and step 4c (the kit change)

This note hands design system version 8 to Claude Code, and with it step 4c of the PRD: the kit change for Gloam Hallow. It follows `HANDOVER-bosses-7.md` (version 7, kit 0.7.0). Written 4 November 2026 in Barney's Claude app project. Read it all before changing anything.

There are two jobs, done in this order and committed separately:

- **Part A, the copy** (small): refresh `lantern-box/design-system/` to version 8 and commit it with the gameplay note. Commits CM68 and CM69.
- **Part B, step 4c** (large, its own job): bring the play parts into the kit. Plan first, then build in steps with check-ins, as in phase 3. Commits from CM70.

## What version 8 is

Step 4b of the PRD designed Gloam Hallow's play parts in twelve review rounds (3 and 4 November 2026), each one agreed by Barney. Version 8 gathers them into the design system. The review page is https://claude.ai/artifact/8YsVGkvjAtffu1GFMzMLgn. It opens for Barney but you may not be able to read it, and you don't need it: everything it drew is in `components/play.js` and the components' READMEs.

What changed, in `lantern-box/design-system/`:

- **New: `components/play.js`** (1.0.0, 321 KB). The play parts as the review page drew them, in its load order. It runs after `bundle.js` and shares its top-level names. Its header lists the source files and what each one holds.
- **New components** (README and preview each): Moves, Spells, Loot, Ground, Checkpoint, MonsterAttacks, BossAttacks, HUD, TouchControls, BossBar, PlaqueLine, PlaceCard, Moments, HowToPlay, WinCard, Modes, HysteriaFinish (*later*), Sound.
- **`components/bundle.js` 8.0.0** (the World):
  - The boss names are capitalised, because they are names: The Veiled Ghost, The Tentacled Skull, The Moor Mother, The Gaping Tree.
  - The crow is redrawn side on, beating its wings like the bats (`crowSide`). Two flocks cross the moor's far sky (`drawCrowFlocks`) and crows also fly alone nearer (`drawCrowsAlone`).
  - Leaves blow across the Mist (`drawLeaves`, `leafShape`).
  - The scene calls all of these where it draws its flyers. The old `drawCrow` and `drawCrows` are kept but no longer drawn.
- **`components/bundle.css`** gains:
  - the HUD additions (round 9);
  - the moments' plaque line, name plaque and place card (round 10);
  - the screens (round 11), including the title arch with four items.
- **Tokens**, in `tokens.json` (version 8) and `tokens.css`:
  - six new colours: `boss-top`, `boss-low`, `boss-trace`, `touch-face`, `touch-face-light`, `touch-face-pressed`;
  - the WISPS label is 12px on a phone, because no text in play on a phone is under 12px;
  - `hud-face`'s note is corrected; the look is unchanged.
- **Names**: the place is now called "Blood Red Rain" everywhere, not "Blood-red rain". The design has the tie belt in place of the scarf.
- **Updated components**, each with a "## Version 8" note: Vitals, HudTile, WispCounter, PlayScreen, TitleArch, TitleScreen, Wanderer, Bosses, Monsters, Places, Flyers.
- **`assets/Licences/README.md`** records the source and licence of Barney's two recordings: the hurt and the crows' caws, both from Pixabay.

`lantern-box/GAMEPLAY-gloam-hallow.md` holds the rules and every *starting figure*. It was written into the repo on 3 November and edited after each round, but has never been committed; Part A commits it. Between them, the design system says how things look, how big they are and how long they take, and the gameplay note says what happens.

## Part A: refresh the copy, then commit (CM68, CM69)

1. **The staged copy.** An exact copy of version 8, laid out as `lantern-box/design-system/` should stand, is in `dist/lantern-box-design-system-8/`. `dist/` is ignored by git.
   - It holds 111 files: the 74 already in the folder (some changed) plus 37 new. Nothing is removed.
   - `dist/lantern-box-design-system-8.sha256` lists every file's SHA-256.
   - It includes `ABOUT-THIS-COPY.md` for version 8.
   - It includes `tokens.css` whole. It was generated in the Claude app project in the design system page's own layout, and checked against the version 7 `tokens.css` here: they are identical apart from the six new colour lines. So no hand edits are needed this time.
2. **Check the staged copy** against `dist/lantern-box-design-system-8.sha256` before copying. Stop and tell Barney if any file fails.
3. **Copy it over** `lantern-box/design-system/` and check the checksums again in place.
   - `git status` should then show only `lantern-box/design-system/` changes and new files. The untracked items that were there already will show too, and they are not part of this work:
     - `lantern-box/GAMEPLAY-gloam-hallow.md` (CM69 commits it);
     - `CM5.txt`, `CM6.txt`, `CM7.txt`;
     - `games/underdusk/`.
   - Leave all of them alone, apart from committing the gameplay note in CM69.
4. **Update `HANDOVER.md`**:
   - In "Where things are", the copy is now version 8; add "the play parts of version 8 in `HANDOVER-play-8.md`".
   - In "Working with Barney", extend the list of commit numbers: CM68 is the ARCADE.md sound-effects rule, CM69 the design system 8 copy; use CM70 next.
   - Add a short section after "The bosses on a phone": "## The play parts (design system version 8, step 4c)", two or three lines pointing to this note.
5. **CM68** (`CM68.txt`, already in the repo root, written in the Claude app project) commits **`ARCADE.md` only**. The rule now lets a game carry short sound effects that Barney supplies, under 100 KB in all, with their source and licence noted beside the kit.
6. **CM69** (`CM69.txt`, already in the repo root) commits:
   - `lantern-box/GAMEPLAY-gloam-hallow.md`;
   - `lantern-box/design-system/`;
   - `lantern-box/HANDOVER-play-8.md` (this note);
   - `lantern-box/HANDOVER.md`.

   If what you did differs from what CM69.txt says, correct the message before committing.
7. **Check in with Barney before committing**, as always. Show him the `git status` and the paths you will stage for each commit. When he says yes, commit CM68 first, then CM69, staging named paths only. Never push.

## Part B: step 4c, the kit change

The gameplay note ("Then, back in Claude Code") defines 4c:

> the kit change, as its own job, from the refreshed design system: the parts above; the rolling ground and the camera rising with it; two soundtracks and the switch between them; the effects and background sounds. Then rebuild the test page and every Lantern Box game, and Barney runs the speed check again on his computer and Pixel, at a boss with a crowd in the Mist.

"The parts above" are the twelve items in its section "For the design system". 4d (the game itself, `lantern-box/games/gloam-hallow/`) and 4e (the website card) come after 4c and are not part of it.

### Plan first

Before writing any code:

- Read this note, the gameplay note, the design system's `README.md` (its "The play parts (play.js)" section especially), the new components' READMEs and `play.js` itself.
- Then reply to Barney with a step plan for 4c: steps like phase 3's 3a to 3d, each ending in a check-in. For each step, say what it builds, what you will check and what only he can check.
- List your questions.
- Wait for his yes before building.

The split below is a suggestion from the Claude app project. Judge it against the kit's code, which you know and the app project does not.

1. **The World to bundle.js 8.** Bring in:
   - the boss names;
   - the crows (flocks and alone) and the Mist's leaves.

   Keep the kit's own changes: the `&& FX` on the glow, the boss glow drawn onto the scene each frame (`HANDOVER-bosses-7.md`), and the caching. The kit's `BOSS_NAME` (about line 2387 in 0.7.0) is still lower case. The crows need wing positions cached as the bats' 17 are. A flock is 22 crows, 11 with Reduce motion on.
2. **The ground**: the rolling ground with its banks and pits, each place's small pieces, the ten hill sections in each place's fixed order, the flat boss arena, and the camera rising with the ground.
   - Code: `mvroll.js` and `mvlevel.js`, and the helpers they use from `mvcourse.js` and `mvcourse2.js`.
   - **Rounds 5 and 5b (ledges, rooftops, crumbling ledges) were rejected.** `mvcourse*.js` are in play.js only for those helpers; don't port ledges or rooftops.
   - This supersedes the PRD's question 5 wording ("onto ledges and rooftops"): the camera rises with the ground.
3. **The wanderer**: the posable puppet, with the long red tie belt and his lantern, and every move: walk, jump, land, climb, roll, sword swing with both upgrade looks, cast, hurt, the second of safety, the life lost.
   - Code: `wand.js`, `pstrip.js`, `moves.js`, `mvmoves.js`, `mvscene.js`.
   - Poses are painted once per step, the kit's way.
4. **Spells, loot and checkpoints.**
   - Spells: heal and fireball, each stronger with each scroll, plus the not-enough-mana sputter (`mvspells.js`).
   - Loot on the ground, dropping and picked up (`mvloot.js`).
   - The checkpoint lanterns on each place's post (`mvlamp.js`).
5. **Monsters' and bosses' attacks**: each attack, its signal and its hit reaction; the ground warnings; the boss arriving; the boss bar.
   - Code: `mvmon.js`, `mvboss.js`.
   - With `K.hud` set, `mvboss.js` hands the boss bar and the name plaque to the HTML HUD (`K.bar`, `K.plaque`) instead of drawing them. The kit's HUD is HTML, so use that path.
6. **The Interface**:
   - bundle.css's new parts into `lantern-box.css`;
   - the HUD (`hud10.js` builds its markup, as the reference): full vitals with life lanterns and armour pips, the spell socket, the "?" tile, the boss bar, the plaque line, the name plaque, the place card;
   - the phone's touch controls (TouchControls);
   - the screens: the title arch with "How to play" as its second item, the how-to-play page with Barney's words, the win screen with its lives bonus counted in. Modes and Hysteria's finish are *later*: build them only if the plan says so.
   - The life lost and the return at the checkpoint (`mv10.js`).
7. **Sound**:
   - `SND` from `snd12.js` and `SND_CLIPS` from `clips12.js` become the kit's sound. Lantern Box's soft menu sounds replace Retro Kit's square-wave set. Each place has its background sound.
   - The two soundtracks and the switch between them: the kit side only; each game's `music.js` is the game's (see HANDOVER.md, Soundtrack).
   - `GAIN`, `BED` and `EV` are measured *starting figures*.
8. **Rebuild and measure**: rebuild the test page (`lb-sampler`, showing the new parts so Barney can check them on his Pixel) and `lb-empty`. Then Barney's speed check, at a boss with a crowd in the Mist.

### Rules that carry over from phase 3

- **The design system is the spec.** Port the drawing code from `bundle.js` and `play.js` word for word. The kit's way (tiles, cached poses, sprites) changes *when* things are drawn, never *what* they look like or *how long* a moment takes.
- **The tools draw; games decide.**
  - 4c builds the parts a game calls.
  - Gloam Hallow's rules belong to 4d: the order of play, damage, scoring, what a monster chooses to do, which monsters come back after a life lost.
  - The `loopX` functions in play.js are the review page's loops. They show each moment's timing and order; they are not game code.
- **Limits**: no outside libraries, no image files, named colours (tokens) only. Keep the photosensitivity limits, Reduce motion (never shake) and Effects off (no glows).
- **On a phone**, no text in play is under 12px.
- **Where play.js and the gameplay note disagree** on a figure, ask Barney.

### Things to know about play.js

- **Review-page code.** It draws the mock-up way, redrawing everything every frame, in one shared scope with `bundle.js`. Names are short and some are reused.
- **One clash is already fixed.** `mvloops.js`'s dodge-roll loop was renamed `loopDodge` in play.js, because `mvroll.js` also defines `loopRoll` (the course). The review pages from round 5c onward silently used the course one.
- **The sound** uses the Web Audio API, unlocked on the first key or tap.
  - Blood Red Rain's rain is City Nights' `rainLoop` code.
  - The thunder is a torn noise crack plus several low "rumble" swells.
  - The crows' call is two to four consecutive caws from the seven clips, played at a rate of 0.93 to 1.01.
- **The clips are 45 KB**, base64 MP3s.
  - ARCADE.md's new rule wants their source and licence noted beside the kit: add a note in `lantern-box/kit/licences/`, taking the text from `design-system/assets/Licences/README.md` ("Sounds").
  - A build check that the clips stay under 100 KB in all would enforce the rule.
- **One question for Barney: which soundtrack file is track 1?**
  - Track 1 plays for Night and Blood Red Rain, track 2 for Dawn and the Mist (gameplay note, Sound).
  - The files are `Lantern_in_the_Moor.mp3` and `The_Long_Vigil.mp3`.
  - Neither note says which is which. Ask; don't guess.

### Version, checks and commits

- **Kit version.** 0.8.0 would follow the pattern (design system 7 went with kit 0.7.0). Confirm with Barney.
- **The checks at the end**:
  - the build gives no warnings, and the console is clean;
  - the test page matches the design system's previews (Barney can open the artifact);
  - Effects off and Reduce motion behave as specified;
  - the speed check: Barney measures at a boss with a crowd in the Mist. The phone must reach at least 30 fps with frames in 25 ms or less on the Pixel, and the computer 60 fps, in Chrome. The phone had about 9 ms of headroom in phase 1, and 4c adds the wanderer, the ground, the HUD, the crows and the leaves, so measure early, not only at the end.
  - Say what you could not test.
- **If the design system doesn't cover something, or a rule seems wrong**, stop and ask Barney. Design changes are made in the design system first, in his Claude app project. The next one is version 9. Then this copy is refreshed.
- **Commits**: CM70 onward, one per step, after checking in with Barney. Stage named paths only. Never push.
