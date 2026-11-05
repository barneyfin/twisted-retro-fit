Lantern Box is the look of a set of side-on browser games in Barney's arcade, Twisted Retro Fit: backlit cut-out silhouettes in layered, coloured air, like a paper theatre or a bat light box lit from behind. Black card scenery, monsters and a hooded wanderer stand against four coloured skies; small lights glow gold, danger glows ember, and a few menacing things at ground level are lit witch-green. The pilot game is Gloam Hallow, a dark-fantasy hack and slash. The kit also hosts platformers, runners and side-scrolling shooters on one plane; never games that run into the screen or are seen from above.

## The one rule: two layers

Every screen has two layers.

- **World**: the scene, drawn on a 2D canvas into a 540-line picture (`picture-height`) that fills the window, as a paper theatre: the sky and its light, four backdrop layers, the play strip (the path, its props, the monsters, the bosses and the wanderer) and a fore layer of plants and overhanging branches. Everything is drawn in code by `LanternBox.world` (the World group of components); there are no image files.
- **Interface**: everything a player reads or presses, as HTML over the picture. **Brass plaques** (dark chamfered panels with a thin brass edge) for every screen and for the HUD. **The lancet arch** (a gothic arch cut from black card, lit from behind) for the title screen only.

The arch is kept to the title on purpose: it is the one moment the Interface joins the paper theatre. Pause, settings, game over, initials, high scores, the rotate notice and the HUD are plaques, so play always reads the same way.

During play only the HUD sits over the picture: health and mana top left, the tiles and the wisps counter top right. Everything else that happens in play (a hit, a defeat, a wisp rising) is World and is drawn in the scene.

## Content fundamentals

- **Interface copy is sentence case**: "Start game", "High scores", "Reduce motion", "Quit to menu". Buttons are verbs or plain nouns; never "OK".
- **Headings are plain words** in IM Fell English: Paused, Settings, Game over, New best, High scores, Turn your phone sideways. No ALL CAPS in source; the few uppercase lines (WISPS, NEW BEST, column heads) are uppercase by `text-transform`.
- **The score is counted in wisps**: each defeated monster's pale wisp rises towards the counter. Write "1120 wisps" in sentences, "WISPS" as a label. The HUD counter and the title's Best are padded to four places with zeros (`0450`); the game-over number, the line above the initials and the high-score table are not (`880`).
- **Numbers are Alegreya Sans bold with tabular figures**, never IM Fell English: its old-style figures make 1120 read as "II2O".
- **Controls are named, not described**: a keycap, then the action in `hint` ("Esc resume", "↑ ↓ choose · Enter select"). Computers only; phones get no keyboard hints.
- **Tone**: dread, not cute, and plain in the Interface. No exclamation marks, no emoji, no jokes. "Game over", not "You died". No blood anywhere: a defeated monster breaks into card pieces.
- **Names are invented**. *Ghosts 'n Goblins* is a reference for how Gloam Hallow plays, never for its knight, monsters, look or title. Players are adults and teens.
- **Sample names and numbers** in these previews (MOR, VEX, 2480 and so on) are made up.

## Visual foundations

### Colour

- **Black silhouettes against coloured skies.** Scenery cut-outs and the wanderer are flat `ink`. Monsters and bosses are black card pieces graded from `card-charcoal` inside, through `card-black-3`, `card-black-2` and `card-black-1`, to `ink` at the edge, each piece inside a thin ink edge (version 6; the lighter steps raised in version 7 so the grading shows on a phone): a limb is graded across its width, lighter on its upper side; a body piece is lightest high on the creature. Hairline claws and twigs stay ink. Scenery's depth comes from the air, not from grey: each backdrop layer is `ink` mixed towards the place's air (`night-air`, `storm-air`, `dawn-air`, `mist-air`) by its tint (`night-tints` and so on in Picture), so far layers fade into the sky and near ones stay black. Nothing is lighter than a cloud behind it: in front of a cloud, layers 1 and 2 and the far bat swarm are mixed towards the cloud's own colour instead, by `thru-cloud` of their tint (version 10). The steps between the layers are kept wide, so the four layers stay apart on a phone's small picture. The edges of layers 2 to 4 carry a little of the place's haze (`night-haze` …).
- **Light has fixed roles.** Never swap them.
  - `gold-light` and `lamp-glass`: glow points only. Lit windows (`window-dark` when unlit), candles, lamps and lanterns, string lights (`string-light`, `string-light-storm` in the rain, with `string-glow`), the crack of light under a door, the wanderer's lantern (`lantern-glow`). Never on a monster.
  - `potion`: the potion is the one glow point in its own red.
  - `ember` with `ember-glow` and `ember-hot`: danger only. Monsters' eyes (`ember-eye-core` pupils), their 2.5px rim and 11px glow, ember throats with `bone` teeth, seams; the bosses' ember detail. Never on scenery or pick-ups.
  - Witch-green (`witch-core`, `witch-mid`, `witch-glow`, at the intense strength `witch-intense`): the splashes only, one small menacing thing per stretch of path.
  - `wisp-pale` (glow `wisp-pale-glow`): a defeated monster. `wisp-gold` (glow `wisp-gold-glow` through `gold-light`): a defeated boss.
- **The wanderer** is `ink` with a thin lit edge in the place's light (`night-edge` …), a gold lantern and one red (`wanderer-scarf`): the long red tie belt, knotted at the back with two tails trailing, which replaced the scarf (PRD question 8, settled in step 4b round 1b).
- **Bosses** are black card like the monsters, graded the same way, with the monsters' ember eyes, mouths, rim and glow (version 6). Their nod to the level's colour is small: a few inner lines lit faintly in it and a glow behind them (`boss-night-aura` …), which since version 7 lightens what is behind the boss (`boss-glow`) so it shows on a phone, against the bright horizon and on the Mist's pale sky. The moor mother's dead eye (`boss-dawn-dead-eye`) and the gaping tree's moss (`boss-mist-moss`) are their only other colours.
- **Plaques**: edge `brass` 1.5px round a `plaque-face` (dialogs) or `hud-face` (HUD) face. Headings and numbers `heading`; items and names `text`; values `text-2`; descriptions, ranks and hints `text-3`; a letter not yet chosen `text-dim`. The selected item, primary buttons, a toggle that is On, the chosen segment and the highlighted row are the brass band: `brass` with `on-brass` text. Secondary controls are outlined in `brass-dim`. Rules are `brass-dim` lines either side of a `brass` diamond; row hairlines `rule-row` and `rule-dark`.
- **The arch** is `ink` card lit from behind (`arch-filter`: `arch-edge`, `arch-glow`, `arch-glow-far`). Its lettering is light coming through cut letters: the name `title-letter` with `glow-title`, the selected item `title-selected` with `glow-title-item` beside a `gold-light` candle flame, other items and the Best label `title-item`, the hint `title-hint` with keycaps in `title-key` and `title-key-line`.
- **Health and mana**: health a vertical blend `health-top` to `health-low`, mana `mana-top` to `mana-low`, each in a `track` with a `track-line` edge. The heart and the flame icons beside them are `brass`.
- Over the picture, dialogs sit on `scrim`; the title arch on `scrim-title`.
- No hex values in games: games name these tokens, and the World code names its palettes (`LanternBox.world.pal`).

### Type

- **IM Fell English** (`display`) is for words that are headings: the game's name in the arch (`title-xl`), plaque headings (`heading`, `heading-phone`) and initials (`initial`). Nothing else, and never numbers.
- **Alegreya Sans** (`text`) is everything a player reads in a list or a sentence: `title-item`, `menu`, `setting`, `button`, `body`, `segment`, `note`, `hint`, `label`, `flag`, `unit`.
- **Numbers** are Alegreya Sans 700 with `font-variant-numeric: tabular-nums`: `score-xl`, `counter`, `best`, `table-score`, with `counter-label` above the HUD counter.
- Both fonts are files in this system (`fonts/`), Fontsource's Latin cuts (version 5.3.0) under the SIL Open Font License; the licences are in Licences. Games embed the fonts with their licences; never link a font service from a game.
- The Latin cuts have ↑ and ↓ but not ← and →. Keycaps draw all four arrows as small strokes (Keycap), never as characters.

### The brass plaque

- A plaque is two nested boxes cut by the same chamfer: an outer `brass` box with 1.5px padding, and the face inside it. Corners are cut, not rounded (`chamfer-plaque` 10px, face 9.4px; `chamfer-hud` 8px for the HUD; `chamfer-control` 6px for bands, primary buttons, toggles and tiles). See Plaque.
- Dialog faces are padded `space-7` top, `space-6` sides and bottom (a little less on a phone), parts `space-5` apart. The heading comes first, centred, then a rule: two `brass-dim` lines with a `brass` diamond between them.
- Menu items are `item-height` tall (44px on a phone), `menu` type. The selected item is the brass band with a small `on-brass` diamond before its label; other items are plain `text`, their labels lined up with the selected one's.
- Widths on a computer: pause 340px, game over and high scores 420px, initials 400px, settings 500px. On a phone held sideways: pause 300px, game over 560px, initials 580px, high scores 660px, settings 680px, each laid out to fit 390 points of height (the phone layouts in each screen's component).
- No shadow under plaques: the brass edge is enough against the scrim.

### The lancet arch (title screen only)

- A gothic arch cut from black card, 340 by 488px on a computer (260 by 374 on a phone), standing on the left, its foot torn ragged, glowing as if lit from behind (`arch-filter`).
- Inside, centred: the game's name on two lines (`title-xl`), a short rule with a diamond in `arch-edge`, the title menu (Start game, High scores, Settings), the Best line, and on a computer the keyboard hint.
- The selected item glows in `title-selected` with a candle flame (`gold-light`) before it; there is no band. Two arch tiles (sound, full screen) stand top right: round-topped `ink` tiles with a lit ring (`shadow-arch-tile`).
- The place behind runs on slowly under `scrim-title`.

### The HUD

- Health and mana share one plaque top left, `space-5` in (12px and 10px on a phone): a heart and the health bar (10px tall), a flame and the mana bar (7px tall).
- Top right, left to right: the full-screen tile (computers only), the pause tile, the wisps counter plaque (WISPS label over the `counter`). Tiles are 40px on a computer and 44px (`target`) on a phone.
- Version 8 grows it (HUD): health with three armour slots, mana, a lantern per life and the spell's socket in one plaque; the "?" tile between full screen and pause; the boss bar along the bottom middle in a fight; a plaque line at the top middle when a spell or the sword gets better; the phone's stick and three buttons (TouchControls).
- The HUD never moves, flashes or shakes. Hits and pick-ups are shown in the World.

### The World: a paper theatre

- The picture is 540 lines tall whatever the window (`picture-height`); its width follows the window. Everything is laid out in picture pixels and scaled to fill.
- From back to front: the sky blend (four stops, `night-sky-1` to `night-sky-4` and so on), its light (a detailed moon; at Dawn a setting moon, stars and daybreak; in Mist a pale sun with rays), ragged cut-card clouds sliding slowly, backdrop layers 1 to 4 (far hills with a lit crest, then trees and buildings, larger and blacker as they come nearer), flyers between them, the play strip on the path (`ground-line`), and the fore layer: plants along the bottom edge and branches overhanging from the top edge.
- Layers slide with the camera at their own rates (`parallax`). The camera also rises with the wanderer onto ledges and rooftops; each layer rises by its own rate, and the overhanging branches stay pinned to the top edge.
- **The lift**: each place is seen from a little above the path (`night-lift` 60, `storm-lift` 70, `dawn-lift` 30, `mist-lift` 35 picture lines). The picture is drawn as if the camera had risen that far, with the path kept at its height, so the far layers stand higher and their feet spread apart; on a phone's small picture this keeps the layers from running together. The path, the rain, the fore layer and the vignette do not move with it, and the camera's own rise adds on top.
- Monsters and bosses move like card puppets: their poses change in steps, `puppet-steps` times a second, with long angular limbs like the trees.
- **The four places**, one per level:
  - **Night**, the graveyard at the edge of the village: an amber-to-violet sky, a detailed moon, gnarled pollard trees, crooked houses, graves, a ruined wall, string lights, bats.
  - **Blood Red Rain**, the old town: crowded rooftops and spires, street lamps, barrels, a well, a gate arch, Blood Red Rain in two depths and distant lightning, bats.
  - **Dawn**, the open moor: cold blue light, standing stones, cairns, dry-stone walls, stone circles (each on a low rise, as high as its far stones are lifted, so every stone stands on ground; some with an arch of two rough uprights under a rough lintel, cut like the standing stones), a dolmen, a pale moon setting on the right and daybreak on the left, light lying in the hollows (`dawn-hollows`), crows.
  - **Mist**, the wind-bent forest at green midday: every tree bent the same way, the sun a pale disc, stumps, ferns, a fallen trunk, a candlelit shrine, a woodcutter's hut, long bands of mist (`mist-band`), pale dim eyes that blink in the trees, a few crows.
- **Standing out**: monsters carry ember eyes and an ember rim, so they read against black scenery. In Night and Mist the nearest backdrop layer is a step lighter, with a haze rising behind the path.
- **Splashes of colour**: one small, menacing thing at ground level per stretch, lit witch-green at the intense glow, with a slow small flicker and a pool of light on the ground. Night, a pierced tin grave lantern; Blood Red Rain, a grotesque on a post; Dawn, an iron fire basket; Mist, a horned mask nailed to a stump.
- **Defeat**: a monster falls apart into its card pieces, which tumble away and fade, and a pale wisp rises towards the score. A boss does the same with a large golden wisp, its glow fading as it breaks.
- **Bosses** (version 6): one per place, drawn 1.2 times their first size (`boss-scale`), so larger than the monsters and up to about 1.4 times the walker's height. Night, the veiled ghost: a tall torn shroud, a pointed hood, long arms with hooked claws. Blood Red Rain, the tentacled skull: two angular horns, a working jaw, jointed tentacles. Dawn, the moor mother (in place of round 12's cauldron witch): smooth antlers, a split face (a pale dead eye; an ember eye, fangs and a tusk), a cluster of ember eyes on a spiked shoulder, a bony hand, an angular toothed sickle claw, four spider legs under a ragged robe. Mist, the gaping tree: leaning with the wind, a small skull's face in the bark, strong roots spreading from a contoured base, two angular side branches below the crown, no arms, hands or legs.

### Layout

- The picture fills the window; the Interface is laid out in CSS pixels over it, at the sizes in each component.
- Computers: designed at 960 by 540; dialogs centred.
- Phones are played held sideways (844 by 390 points as designed). Every phone layout fits within 390 points of height; controls are at least `target` (44px). A phone held upright shows the rotate notice.

### States and focus

- Menus have a selected item (the brass band, or the glow on the arch). Arrow keys move it, Enter or a tap confirms, Esc goes back. Keyboard focus follows the selection, so the band is the focus mark.
- Every other control shows keyboard focus with a 2px ring in `focus`: inside a chamfered control (the chamfer clips anything outside), in `on-brass` on a brass fill; outside round controls (the slider, arch tiles), offset 2px.
- Hover lightens an unselected item's text to `heading`. Disabled: 45% opacity.
- Toggles say On or Off in words, not only by colour: On is the brass band, Off is outlined.

### Motion and safety

- Slow light only: candles and lanterns flicker gently, the potion pulses, string lights twinkle, splashes flicker a little, the Mist trees' eyes blink now and then, a boss's glow behind it fades as it breaks and returns with it. Each stays under 3 times a second.
- Lightning is a distant bolt and a slow swell on the sky only. The whole screen never flashes, and nothing bigger than a character flashes more than 3 times a second.
- **Reduce motion** (starting from the device's `prefers-reduced-motion`): the backdrop layers slide at 0.4 of their rates and the fore layer at 1.08, the rain, clouds, mist and flyers slow, puppet poses move smoothly at half speed instead of stepping, the splash flicker stops, and the game never shakes the screen.
- Interface changes are instant: no sliding panels, no bouncing.

## Iconography

- Interface icons are simple 24-viewBox strokes, 2px, round caps, drawn in `heading` on plaques and `title-letter` on the arch: sound, full screen, pause, the rotate phone. The heart, the mana flame and the candle flame are small solid shapes. The diamond is the plaque's one ornament (on rules, before the selected item, either side of NEW BEST, on Play again).
- No emoji, no icon font.

## Sound

- Two soundtrack MP3s per game (ARCADE.md allows two in a Lantern Box game); which places get which, and when they switch, is decided by each game's gameplay.
- Short effects for the Interface (choose, select, back): in Lantern Box a muted tick, a soft chime and a falling tick, not the shell's square-wave blips. Volume scales everything; 0 mutes.
- Gloam Hallow's play sounds and each place's background are made in code, apart from two of Barney's recordings (the hurt and the crows' caws; ARCADE.md allows short sound effects since 4 November 2026): see Sound, and `SND` in play.js. Levels are set by measured loudness.

## Settings

- From the title menu and from pause. The arcade's shared settings, in this order, then Lantern Box's Picture:
  - **Volume** 0 to 100%.
  - **Effects**: "Glow round lights, eyes and splashes." Off draws the lights, eyes and splashes without their glow.
  - **Reduce motion**: "Flatter scenery, slower rain, no shaking." As in Motion and safety.
  - **Picture**: Automatic, Best, Faster, Fastest. "Automatic picks the most detail your device can run smoothly." Automatic is the default.
- The arcade's Solid panels setting is not shown (plaques are already near solid) and its saved value is left alone.
- Changes apply at once; Done (or Esc) only closes the plaque.

## Screens every game has

- **Title** (TitleScreen): the arch over the first place, running slowly. Start game, High scores, Settings.
- **Play** (PlayScreen): the World and the HUD.
- **Pause** (PauseOverlay): Esc, P, the pause tile, losing focus or turning a phone upright. Resume, Restart, Settings, Quit to menu.
- **Game over** (GameOverCard): the score large; NEW BEST when it beats the best on this device. If it makes the top ten, the only button is Continue, to the initials; otherwise Play again, High scores, Menu.
- **Initials** (NameEntry), then **High scores** (HighScores) with the new row lit; from the title, High scores shows the table alone.
- **Settings** (SettingsPanel), over whatever opened it.
- **Rotate** (RotateNotice) on a phone held upright.
- A modes screen only if a game has modes.

## Using the World code

`components/bundle.js` carries the approved drawing code as `LanternBox.world`: round 12 of the directions page, with the changes of versions 2 to 11 made in it (the places' changes; the new bosses; graded card pieces for the monsters). Draw from it; never redraw a part by eye. Its parts are described in the World components; its palettes are `LanternBox.world.pal`, matching the World tokens here. The drawing is the mock-up way (every layer redrawn every frame); games draw the same shapes the kit's way proved by the phase 1 speed test (layers painted once in tiles and slid, poses painted once per step), which changes when things are drawn, never what they look like.

## The play parts (play.js)

`components/play.js` (version 8; 1.0.1 in version 9, 1.1.0 in version 11) carries everything designed for Gloam Hallow in step 4b's play-parts rounds, as the review page drew it, beside `bundle.js`: the wanderer's moves (Moves), the spells (Spells), the loot (Loot), the rolling ground, its pieces and the hill sections (Ground), the checkpoint lanterns (Checkpoint), the monsters' and bosses' attacks (MonsterAttacks, BossAttacks), the moments (Moments, PlaceCard), the HUD builder (HUD), the potions kept for later (Potions, version 11) and the sound (Sound). Its loops are the timing reference. It is the spec for the kit change (step 4c): Claude Code turns it into kit code without changing what it draws or how it times it. The gameplay note (`lantern-box/GAMEPLAY-gloam-hallow.md`) has the rules and the starting figures.

## Versions

- **Version 11** (5 November 2026, round 13, agreed by Barney: "All as agreed"): **potions kept for later**, one health and one mana, in two sockets under the plaque, drunk with a tap, Q or E (Potions, new: the sockets' looks and moments; HUD, Vitals, Loot, HowToPlay, Sound); **the plaque line moves** under the HUD's top row (PlaqueLine); **the double tap to roll** (TouchControls); **lit through a cloud softened** for the far layers (Places, Flyers); **the ghoul lurches** so its swipe outreaches the sword and **the walker's high sweep means stay down, or roll** (MonsterAttacks); **the Gaping Tree's branch at head height** (BossAttacks); monsters face the wanderer in a game (Monsters). bundle.js 11.0.0, play.js 1.1.0, tokens version 11 (`thru-cloud-soft`, `thru-cloud-far`).
- **Version 10** (4 November 2026, Barney's option A, after he found it on his Pixel): lit through a cloud. Where a cloud is behind them, backdrop layers 1 and 2 and the far bat swarm take the cloud's own colour a step darker (`thru-cloud`, 0.75 of their tint), so a distant tower or bat no longer shows lighter than the cloud behind it (Places, Flyers). bundle.js 10.0.0; tokens version 10 (`thru-cloud` in Picture).
- **Version 9** (4 November 2026, four small fixes found while building the kit in step 4c, bundled by Barney): the mouth-hat's signal eyes follow its hop, so no second pair of eyes shows (MonsterAttacks); the Veiled Ghost's "behind" signal fades smoothly instead of flickering 8 times a second (BossAttacks); the moor's crow flocks drawn nearer `ink` so they show across the dawn sky (Flyers); the place list's names capitalised as agreed (Places). bundle.js 9.0.0, play.js 1.0.1. No other changes.
- **Version 8** (4 November 2026, step 4b's play-parts rounds 1 to 12, agreed by Barney): the play parts gathered in. New: `play.js` and the components Moves, Spells, Loot, Ground, Checkpoint, MonsterAttacks, BossAttacks, HUD, TouchControls, BossBar, PlaqueLine, PlaceCard, Moments, HowToPlay, WinCard, Modes and HysteriaFinish (later), and Sound. Changed: bundle.js 8.0.0 (the boss names capitalised; the crow redrawn side on with flocks over the moor; leaves on the Mist's wind); bundle.css (the HUD's new parts, the moments' plaques, the screens; the title arch with four items); six colours (`boss-top`, `boss-low`, `boss-trace`, `touch-face`, `touch-face-light`, `touch-face-pressed`); the WISPS label 12px on a phone; `hud-face`'s note corrected; the place name Blood Red Rain; the tie belt for the scarf. Vitals, HudTile, WispCounter, PlayScreen, TitleArch, TitleScreen, Wanderer, Bosses, Monsters, Places and Flyers note what changed.

- **Version 7** (3 November 2026, the Gloam Hallow Bosses round 11, option B, chosen by Barney on his Pixel): the graded blacks and the bosses' glow made to show on a phone. The card blacks' lighter steps raised (`card-black-1` 17141b, `card-black-2` 27232d, `card-black-3` 3a3544, `card-charcoal` 504a5c), for the monsters as well as the bosses; the glow behind a boss 1.2 times larger, 1.6 times stronger, held out further and drawn to lighten what is behind it (`boss-glow`, `bossGlow`).
- **Version 6** (2 November 2026, after the Gloam Hallow Bosses rounds 1 to 10, chosen by Barney): the four bosses redrawn as graded black card with ember detail and a small nod to the level's colour, the cauldron witch replaced by the moor mother, the bosses 1.2 times larger; the monsters' card pieces graded as the bosses'; the bosses' faded level palettes removed from the tokens and from `LanternBox.world.pal` (now `BOSS_AURA`, `CARD_BLACKS` and `NOD_COL`).
- **Versions 2 to 5** (2 November 2026, made in Claude Code and chosen by Barney): changes to the places, among them each place's lift, wider steps between the backdrop layers, the moor's stone circles and backdrop doors and windows ending at their layer's ground line. The artifact's history has each one.
- **Version 1** (1 November 2026): approved by Barney.
