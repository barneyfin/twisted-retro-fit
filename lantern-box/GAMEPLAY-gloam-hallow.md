# Gloam Hallow: the gameplay (PRD question 6)

Written 3 November 2026 in Barney's Claude app project, *Browser Arcade*, from his answers in the step 4a interview. The interview is in his vault note (`AI Projects/Browser Arcade/Gloam Hallow.md`, now frozen), where every answer is dated. This note answers PRD question 6 (the gameplay) and the rest of question 7 (which places get which track). It also lists what the design system needs before the kit can be changed and the game built: that design work is step 4b, done in the Claude app project first (the last section but two).

Every number marked *starting figure* is Barney's first guess, to be tuned once he has played the game on his computer and Pixel.

## The game in a few lines

A hooded wanderer with a lantern and a sword fights through four places in one night and the next day: The Graveyard (Night), The Old Town (Blood Red Rain), The Open Moor (Dawn) and The Wind Bent Forest (Mist); the places' names are proper names, capitalised, without hyphens (Barney, 4 November 2026, step 4b round 10). The way forward is mostly fighting, over ground that rolls up and down in hills and steep banks; small pieces to stand on and climb (walls, tombs, crates, stumps, stones) hold loot and potions. Defeated monsters break into card pieces, their wisps rise to the score, and they sometimes drop loot. Each place ends with its boss. Beating the fourth, The Gaping Tree, is a win. Health, three lives and armour keep you going; heal and fireball spells cost mana. No timer.

## Modes

Two, each with its own high-score table. **Hysteria comes after the first playable version** (see Scope); until then there is one mode and no modes screen. The website's card shows The Wandering Rot's best wisps.

| Mode | Note in the modes menu | What it is |
|---|---|---|
| The Wandering Rot | Night to Mist. Beat them all. | Everything below. Scored in wisps |
| Hysteria | Every second counts. | "Beat the clock as fast as possible; wisps don't count" (Barney). Night to the Mist's boss once, every boss beaten, 3 lives; the clock never stops, through deaths and restarts; game over leaves no time. Its table lists the fastest times first. Locked until the player has beaten The Wandering Rot and its second loop; the device remembers the unlock (one saved flag, beside the high scores). While locked, its note reads "Fell The Wandering Rot to begin anew—walk the cursed path once more against darker terrors." (Barney, 4 November 2026) |

**Saving.** The arcade's shared settings and per-game high scores, plus the one Hysteria flag. This is the only saved state: a run always starts at Night (the PRD's out-of-scope line, changed 3 November 2026). Hysteria's times stay in the game. The kit's shell sorts every table highest first, and the website's card shows the highest number across a game's tables. Save and show the times so that Hysteria's table lists the fastest first and a time never becomes the card's best. The website itself does not change (Barney, 3 November 2026).

## Moving, fighting and the controls

- **Actions**: walk, jump, climb up a steep bank or onto a tall piece, swing the sword, cast the chosen spell (it costs mana), switch between the spells found, dodge roll, pause.
- **Keyboard**: WASD or the arrows move (W or up climbs a steep bank or a tall piece; S or down does nothing, as nothing is dropped through); Space jumps; J attacks; K casts the chosen spell; L switches spell; left Shift rolls; Esc or P pauses.
- **Phone, held sideways**: the left thumb has a stick that appears where it touches, anywhere in the left half of the screen, and goes when it lifts (nothing shows at rest): left and right walk, up climbs, down does nothing, and a quick flick rolls. The stick is an octagon with chevrons for left, right and up only. The right thumb has three buttons in a triangle: jump and attack, and above them cast, which shows the chosen spell's picture. Switching spells is a tap on the chosen spell's picture beside the mana bar (step 4b round 9; Barney, 4 November 2026).
- **No touch hint.** Instead a "?" tile beside the pause tile, on phones and computers, opens a minimal how-to-play page with the game paused. The title menu gains "How to play" for the same page.
- **Clashes to watch**: a quick change of direction could read as a flick and roll by mistake (the flick needs a clear threshold, tuned in play). Up on the stick climbs only at a steep bank or a tall piece; it never jumps.

## Places, checkpoints and the run

- **The places, in order**: Night, Blood Red Rain, Dawn, Mist. Each takes about **5 minutes** (*starting figure*) and ends at its boss. A run takes about 25 minutes. Between places, the place card (below) fades through black.
- **The ground** (step 4b round 5; Barney, 4 November 2026): the play layer's floor rolls up and down, never below today's floor: hills up to about half the screen on the moor, about 35 to 40% in the graveyard and the forest, and about 25% in the old town, all with small undulations. A few steep banks (a jump below about 70 high, a climb up to about 130) and pits in the dips (about 45 wide). The camera follows the wanderer along and up, so the layers rise at their own rates (PRD question 5).
- **Hill sections**: each place's level is a flat start, then **ten sections** in the place's own **fixed order**, never the same one twice running, then its boss arena, which is **flat**. Seven section shapes, each starting and ending on the floor, their heights a share of the place's maximum: ripples; a long climb with a crag drop; a bank and plateau; a pit in a dip; the big hill; terraces; a mound between two pits. About 10,600 long in all (*starting figures*: the lengths, heights and orders, in the design system).
- **The sky's flyers** (step 4b round 12; Barney, 4 November 2026): bats at Night and in Blood Red Rain; crows by day. On the moor, two flocks of crows cross the far sky from left to right, as the night's bat swarms do the other way, and three bigger crows fly alone nearer; the Mist has three far crows. The crows are drawn side on, beating their wings like the bats, with a long body, a heavy beak and a fanned tail. In the Mist, leaves blow across from left to right in gusts, tumbling, far and near, never in front of the path.
- **Small pieces** to stand on and climb, each with a lit top edge; the wanderer walks off the end (nothing is dropped through). Graveyard: the arched churchyard wall, a box tomb. Old town: barrels, big crates, a handcart. Moor: the drystone wall, the dolmen, boulders, the cairn. Forest: the fallen trunk, a small stump, the great stump, a mossy rock. No more kinds are needed (Barney). They sit on the sections' crests and plateaus.
- **Checkpoints**: the start of each place, once halfway through it (after the fifth section), and at the boss's door. Each is a lantern on a post that lights as the wanderer passes, and stays lit: the wanderer's own lantern made big, on a post that belongs to the place (graveyard, a wrought-iron crook on a stone plinth; old town, a timber post with an iron sign bracket; moor, a gnarled stake in a cairn; forest, a sapling pole bent over). The boss's door has the same checkpoint (step 4b round 6; Barney, 4 November 2026).
- **Lives**: **3** for the run (*starting figure*). When health empties or the wanderer falls into a pit, a life is lost and the run restarts at the last checkpoint. About **40%** (*starting figure*) of the monsters beaten since that checkpoint come back, so a restart has consequences without being a grind; loot picked up stays picked up. A life lost in a boss fight restarts at the boss's door, the boss at full health (Barney, 4 November 2026, step 4b round 10). **Game over** comes when the lives run out. Game over loses everything (arcade-style).
- **A lost life** refills health and mana and loses the armour. Spells learnt and sword upgrades are kept.
- **The win**: beating The Gaping Tree. The win screen counts the lives bonus into the score.
- **The second loop** (*later*): the win screen offers "Go round again". The same run carries on at Night, harder, with the score still counting; each place's hill sections are shuffled. Beating the tree again unlocks Hysteria.
- **No timer** in The Wandering Rot.

## Health, mana, armour

- **Health** is the HUD's bar. **Armour** is shield pips continuing the health line: the slots are always shown as faint outlines, each piece found fills one, up to **3** (*starting figure*), and a hit takes a pip before any health.
- **Mana** pays for spells. It slowly refills on its own; mana potions refill it faster.
- **Not enough mana**: casting without enough mana casts nothing; the hand's light sputters out in a puff of smoke, so the player knows the button worked (Barney, 4 November 2026, step 4b round 3). While mana is short of the chosen spell's cost, its picture in the HUD dims (step 4b round 9).
- **Spells in the first playable version**: heal and fireball. The first scroll for a spell teaches it; later scrolls make it stronger. The fireball flies at chest height, so it passes over crawlers (the sword's job) and answers the ghoul's long reach; it flies straight until it hits a monster or leaves the screen (Barney, 4 November 2026, step 4b round 3).
- **The sword**: one sword that gets better. Each upgrade gives longer reach or stronger hits. The two kinds of upgrade look different on the ground (a sword for longer reach, a rune stone for stronger hits), so the player can see which it is (Barney, 4 November 2026, step 4b round 4).
- Not decided yet; Claude Code sets starting values for Barney to tune: how much health a heal restores and what it costs; the fireball's damage, cost and speed; the mana refill rate; the health lost to each monster's hit; how many sword and spell levels there are.

## The score: wisps

| Defeat | Wisps (*starting figures*) |
|---|---|
| A small monster (crawler, flyer) | 1 |
| A medium monster (mouth-hat, ghoul) | 2 |
| A large monster (walker) | 5 |
| A boss | 25 |
| Each life left at the win | 10 |
| The second loop (*later*) | all doubled |

The HUD counter shows four digits, so a run (and its second loop) must stay under 10,000. Claude's estimate, worked out rather than measured: a run of four places should come to roughly 400 to 500 wisps, and 1,500 to 2,000 with the second loop.

## Monsters

Their looks are in the design system (version 7: graded black card, ember eyes and rim). Hits to defeat are *starting figures*. All hurt on touch as well as by their attacks. **Every attack is signalled first** (step 4b round 7; Barney, 4 November 2026): the monster winds up for about 0.35 to 0.5 s (*starting figure*) while its eyes flare and the part that will hurt burns hotter (the mouth, the claws, the walker's hollow chest); a sweep leaves a short ember trail; a recovery after each attack is the opening to strike. A one-hit monster breaks into card pieces as soon as it is hit.

| Monster | Size | What it does | Hits |
|---|---|---|---|
| Crawler | Small | Scuttles along the ground in bursts; crouches, then lunges low at your feet and carries on past: jump it, or strike low | 1 |
| Flyer | Small | Hangs with its wings folding, then swoops down to chest height and climbs away: roll under it, or strike it | 1 |
| Mouth-hat | Medium | Hops towards you; squats with its mouth gaping, then hops in and bites: stay just out of reach, then strike | 2 |
| Ghoul | Medium | Lurches in; draws its arm back over its head, then swipes over and down with a reach longer than the sword: roll through under it, then strike | 3 |
| Walker | Large | Stalks slowly and sweeps its branch arms: arms up means a high sweep (roll under), a crouch with arms back means a low sweep (jump) | 5 |

## Bosses

One at the end of each place. A fight lasts about **a minute** (*starting figure*). Each boss has three attacks, and every big attack is signalled first so it can be learnt (step 4b round 8; Barney, 4 November 2026): a wind-up while its eyes flare and the part that will hurt burns; anything that comes up from or down onto the ground is marked first by an ember warning where it will land (a glowing patch with light rising from it; cracks for the tree's roots). In the game a boss chooses among its attacks. A hit: the boss jolts back, its ember rim flares once and the bar drops. The bosses' names are names, so each word is capitalised. Their looks are in the design system (version 7). A boss's health shows as a bar (see On screen).

| Place | Boss | Its three attacks |
|---|---|---|
| Night | The Veiled Ghost | Rears back, then glides at you with its hooked claws (roll under); fades out and reappears behind you (keep moving); rises and wails, a wave of pale fire rolling out along the ground both ways (jump it) |
| Blood Red Rain | The Tentacled Skull | Slams tentacles down from either side onto ember warnings on the ground (get off the glow); draws back and snaps its jaw when you are close (roll away); rises and calls up crawlers through cracked warnings (fight them) |
| Dawn | The Moor Mother | Crouches, then leaps right over you on her spider legs (roll under); raises her sickle behind her, then lunges and sweeps it along the ground (jump it); her shoulder eyes swell, then spit a spread of ember bolts (roll through) |
| Mist | The Gaping Tree | Rooted, never moves: the ground cracks and glows, then roots burst up through it (get off the cracks); a side branch burns, then a long crooked branch grows out of the trunk and sweeps across at head height (roll under); its maw burns, then spits a fan of splinters (roll through) |

A defeated boss always drops a sword upgrade or a spell scroll, besides its golden wisp.

## How it gets harder (*starting figures*)

| Stage | What changes |
|---|---|
| Night | Small and medium monsters |
| Blood Red Rain | More kinds, more at once |
| Dawn | The walkers join |
| Mist | The most at once: up to **8** on screen (the speed test's crowd) |
| Second loop (*later*) | Monsters take more hits and come faster; wisps doubled; each place's hill sections shuffled |

## Loot

Dropped where a monster fell; picked up by touching it. Decided in step 4b round 4 (Barney, 4 November 2026): loot stays until picked up or left behind off the screen, and never times out or blinks; a potion the wanderer doesn't need (health or mana already full) stays on the ground for later; and the places' scenery potions become real health potions, placed on the small pieces and on hilltops.

| Loot | Effect | How often (*starting figures*) | Stacks? |
|---|---|---|---|
| Health potion | Refills some health | About 1 monster in 6 | No: used at once |
| Mana potion | Refills some mana | About 1 monster in 6 | No: used at once |
| Spell scroll | The first teaches a spell (heal, fireball); later ones make it stronger | Only from walkers, about 1 in 4; or a boss's sure drop | Yes, as spell levels |
| Sword upgrade | Longer reach or stronger hits | Only from walkers, about 1 in 4; or a boss's sure drop | Yes, as levels |
| Armour | A shield pip beside health | About 1 monster in 20 | Up to 3 pips |

## Hazards besides the monsters

| Hazard | Effect |
|---|---|
| Pits | Gaps in the path: falling in costs a life |

No thorns or spikes, and no crumbling ledges (dropped in step 4b round 5).

## Moments

Nothing flashes; the only pulse (the wanderer's second of safety) is slow.

| Moment | What the player sees | How long | Does play stop? |
|---|---|---|---|
| Wanderer hurt | Knocked back a step, a burst of ember sparks, health drops; a second of safety, shown by the wanderer's lit edge pulsing slowly | 0.4 s | No |
| Armour pip lost | The pip cracks in the HUD; a few card shards fall from the wanderer | 0.4 s | No |
| Monster hit | It jolts back a puppet step and its ember rim flares once | instant | No |
| Monster defeated | Card pieces and its pale wisp rising to the score (in the design system) | 1.6 s | No |
| Pick-up | The loot lifts into the wanderer with a gold glint; the bar fills | 0.5 s | No |
| New spell or sword upgrade | A brass plaque line at the top middle with the item's picture: "Heal mastered" or "Fireball mastered" for a spell's first scroll; "Heal: restores deeper" or "Fireball: glows brighter" for a later one; "Sword: reaches beyond" or "Sword: bites deeper". Two at once take turns (step 4b round 10) | 2 s | No |
| Heal / fireball | A pale gold glow rises round the wanderer / a fireball in the lantern's gold that bursts where it hits (gold, not ember: ember is for danger only; Barney, 3 November 2026, step 4b round 2) | 0.5 s | No |
| Not enough mana | The hand's light pops into falling sparks and a puff of smoke; nothing is cast (step 4b round 3) | 0.6 s | No |
| Checkpoint | A gold spark leaps from the wanderer's lantern to the checkpoint's; its glass flares with a ring of motes, then glows gold | 0.5 s | No |
| Life lost (or a fall into a pit) | The wanderer buckles, kneels and breaks into card pieces, gold-edged (in a pit, he breaks up as he falls into the dark); his lantern in the HUD gutters out; fade to black; at the checkpoint, its lantern sends a gold spark back to his and he forms again in its light while health and mana refill in steps (step 4b round 10) | 2 s | Yes |
| Boss arrives | The camera locks; the boss comes in its own way (The Veiled Ghost fades in, The Tentacled Skull rises from the street, The Moor Mother strides in, The Gaping Tree tears up out of the ground); its name on a brass plaque at the top middle, the rule under it (round 10); the boss bar fills | 2 s | Briefly |
| Boss defeated | Card pieces and the large golden wisp (in the design system); the boss bar fades; its drop lands. The camera lets go, and the wanderer walks on out of the arena to the right (round 10) | 2.2 s | No |
| Place cleared | When the wanderer walks on out of the arena: fade through black, the HUD with it, to a plaque with the next place's name over the rule and its words below ("Dawn" over "The Open Moor"); the next place fades up behind it. Night's card opens every run the same way, after the title screen (step 4b round 10) | 3 s | Yes |
| The win | The win screen, the lives bonus counted into the score; "Go round again" (*later*) or finish | until chosen | Yes |
| Second loop begins (*later*) | Night again, a plaque: "Again, harder" | 2 s | No |
| Hysteria unlocked (*later*) | On the win after the second loop: "Hysteria unlocked" | on that screen | Yes |
| Game over, new best | The kit's game-over plaque and initials (in the design system) | until chosen | Yes |

## On screen during play

Designed in step 4b round 9 (Barney, 4 November 2026).

- **Top left**, one plaque in three rows: the health bar with its heart and, continuing the line, the three armour slots (a shield pip fills each one held; a hit cracks the last in two and it falls); the mana bar with its flame; and one small gold lantern per life (a spent life's lantern stays, dark, so the player sees how many are left). At the right end, **the chosen spell's socket** (44 px): its picture; two small diamonds when two spells are known, the lit one chosen; empty and dim until the first spell is learnt; dimmed while mana is short of its cost. A tap on it switches spells on a phone (L on a computer); the picture turns over like a card.
- **Top right**: full screen (computers only), the "?" tile, the pause tile and the wisps counter (in Hysteria, the clock instead: TIME over minutes and seconds, in the same plaque).
- **During a boss fight**: a long thin brass bar across the bottom middle (420 px on a computer; 300 px on a phone, between the thumbs) with the boss's name above it in IM Fell English, filled in ember; after a hit a lighter trace of what was lost drains away; gone when the fight ends.
- **On a phone**: the stick and buttons above. The HUD sits 12 px in and 10 px down, plus the phone's own safe margin where it has a camera hole. The camera holds the wanderer where it does on a computer.
- No progress line: the checkpoint lanterns mark the way.
- **A clue besides colour** (the vault note's section 11, settled here): health has the heart and the thicker bar; mana the flame and the thinner bar; armour a shield, solid when held and an outline when empty; lives a lantern, lit with a flame or dark; the spell its own picture, dimmed when mana is short; the boss bar the boss's name; loot its outline and emblem (round 4).
- **Small text on a phone** (section 11, settled here): no text in play under 12 px (so the WISPS label is 12 px on a phone, not 11), nothing the player must read mid-fight under 16 px, no icon under 12 px tall, no touch target under 44 px.

## Screens

Title (with "How to play" added to its menu as the second item: Start game, How to play, High scores, Settings; inside the same arch, the spacing tightens to fit four), pause, settings, game over, initials and high scores as the kit has them. Designed in step 4b round 11 (Barney, 4 November 2026). Added:
- **the how-to-play page**: a plaque headed How to play: the goal in Barney's two lines (under Words), then the controls: on a computer the keys with keycaps (A D or the arrows, walk; W or up, climb a bank; Space, jump; Shift, roll; J, attack; K, cast; L, switch spell; Esc or P, pause); on a phone, the stick and the three buttons drawn small with what each does, and a tap on the spell to switch. From the "?" tile, play is paused behind it and its button is Resume; from the title, Back; Esc does the same;
- **the place card** between places, and before Night at the start of every run;
- **the win screen**: a plaque with Barney's two lines, the rule, then the score as on game over (NEW BEST when it beats the best); under it, "Lives left" with a lantern per life, each one still lit adding its 10 in turn, half a second apart, the score stepping up with it. Then as game over: Continue to the initials for a top-ten score, otherwise Play again, High scores and Menu. Later: Go round again (the primary button) or Finish, which then goes on the same way; after the second loop, "Hysteria unlocked" as a flag like NEW BEST;
- **the modes screen** (*later*, with Hysteria), after Start game, headed Modes: The Wandering Rot and Hysteria, each with its note; Hysteria locked is greyed with a padlock and its locked note;
- **Hysteria's finish** (*later*): its two lines, then the time large in place of the score, to a tenth of a second (24:07.3), Continue to the initials when it is among the fastest ten, and its table of fastest times.

## Words

- Tone: dread, plain, no exclamation marks (the design system's tone). English only.
- **Win screens.** The Wandering Rot: "The flesh yields." over "Gloam Hallow remembers not your suffering." Hysteria: "A blur of severed bones." over "You outran the gloam." Barney kept these as written: they are words only, and nothing on screen bleeds.
- **Plaque lines in play** (step 4b round 10; Barney, 4 November 2026): the place cards, each the place's name over its words, both proper names (Night: "The Graveyard"; Blood Red Rain: "The Old Town"; Dawn: "The Open Moor"; Mist: "The Wind Bent Forest"); the boss names; "Heal mastered", "Fireball mastered", "Heal: restores deeper", "Fireball: glows brighter", "Sword: reaches beyond", "Sword: bites deeper"; "Again, harder" (later). "Hysteria unlocked" is on the win screen.
- **How to play** (Barney, 4 November 2026): "Cut your path through four blighted lands, felling the terror bound to each. Sever the roots of The Gaping Tree to break the night." over "Three chances to break the dark. Fall, and return to the glow of your last lit lantern."
- **Hysteria's locked note** (Barney, 4 November 2026): "Fell The Wandering Rot to begin anew—walk the cursed path once more against darker terrors."

## Sound

- **Soundtrack**: two MP3s from Barney (ARCADE.md allows two in a Lantern Box game). Track 1 plays for Night and Blood Red Rain, track 2 for Dawn and the Mist. They switch at the place card before Dawn. A lost life leaves the music alone; a track restarts only when it begins again at a place card, so on the second loop track 1 starts again at Night. Barney keeps the files until the kit change.
- **Effects** (step 4b round 12; Barney, 4 November 2026), made in code as the kit makes its sounds (oscillators, filtered noise, bells, a little of a dark room behind them): sword swing (a quick whoosh) and hit (a blade's crack and a short metal ring), jump (a cloth flap) and land (a soft thud), roll, hurt, armour crack (a metal clang and a crunch), monster defeated (a card tear and a soft rising wisp note), pick-up (two glints), heal (a warm chord swelling), fireball (a fluttering roar of fire with crackles) and its burst (the same, bigger and longer), not enough mana (a spark and a hiss), checkpoint lantern (the spark and a small chime), the plaque line (a light chime), life lost (falling tones and scattering cards), boss arrives (a deep, growling swell), boss defeated (a deep bell), the place card (a low toll), the win (three bells). Lantern Box's menus have their own soft sounds (a muted tick, a soft chime, a falling tick), not the kit's square-wave blips.
- **Two are recordings Barney supplied** (royalty-free, Pixabay; ARCADE.md allows short sound effects since 4 November 2026): the hurt is the first burst of a man's pain sound ("66 voz hombre dolido", Pixabay 100206), and the crows' caws are seven cut from "Crow sound effect HD" (Pixabay 336784), two to four in a call, each call pitched a touch apart. About 45 KB together.
- **Levels** are set by measured loudness: the big moments loudest, then the main actions, then light touches, then the menus; in each place, its bats, crows, creaks and thunder above its wind or rain (*starting figures*, to tune by ear).
- **Background sound**, quiet under the music: Night, wind and bats; Blood Red Rain, rain (made as City Nights makes its rain) and thunder (a ripping crack, then a long uneven roll); Dawn, moor wind and crows; Mist, creaking trees (often), wind in the leaves and crows.

## Scope

- **First playable version**: everything above except what is marked *later*. That means the four places in order with their monsters and bosses; The Wandering Rot through to the win screen; health, lives, armour and mana; heal and fireball; the loot; the rolling ground with its hill sections, small pieces and pits; checkpoints; the HUD with the boss bar; the "?" page; both tracks, the effects and the background sound; keyboard and phone controls.
- **Later**: the second loop ("Go round again") and Hysteria, with its unlock and its table of times.
- **Never**: blood on screen; saved progress beyond the Hysteria unlock; more than the four places; gamepads (an arcade rule); online scores.

## For the design system (step 4b, in the Claude app project)

The design system is the spec, so each of these is designed there first, then copied here for the kit:

1. **The wanderer's final design and moves**: walk, jump, climb, drop, the sword swing (and how upgrades show), roll, cast, hurt, the second of safety and the life lost. Also PRD question 8, the scarf (pencilled: no scarf, a long trailing red tie belt at the waist).
2. **The spells**: the heal glow and the fireball, and how each grows stronger.
3. **The loot**: potions, scrolls, sword upgrades and armour as they lie on the ground and as they are picked up. Each needs a clue besides colour (the vault note's section 11; settled in round 9, see On screen during play).
4. **The ground and its pieces** (step 4b round 5): the rolling ground, its banks and pits, each place's small pieces, and the hill sections.
5. **Checkpoint lanterns** on posts, unlit and lit.
6. **The monsters' attacks**: the crawler's lunge, the flyer's dive, the mouth-hat's bite, the ghoul's swipe, the walker's sweeps, and their hit reactions.
7. **The bosses' attacks** and each attack's signal, the boss arriving, and the boss bar.
8. **The HUD additions**: the life lanterns, armour pips and their crack, the chosen spell's picture, the "?" tile, the boss bar, and (later) Hysteria's clock. Plus small text on a phone (section 11). Done in round 9.
9. **The moments** table above, where it isn't designed yet: the plaque lines, the place card, the life lost. Done in round 10.
10. **The screens**: the how-to-play page; the title arch with a fourth item, "How to play" (the arch is laid out for three); the win screens; and later the modes screen and Hysteria's finish. Done in round 11.
11. **Sound**: the effects and background sounds named above. Done in round 12.
12. **The ground in the places** (with item 4, round 5): each place's hill heights, pieces and section order; the camera rises with the ground (PRD question 5). Done in round 5; the flyers and the Mist's leaves in round 12.

## Then, back in Claude Code

1. **4c, the kit change**, as its own job, from the refreshed design system: the parts above; the rolling ground and the camera rising with it; two soundtracks and the switch between them; the effects and background sounds. Then rebuild the test page and every Lantern Box game, and Barney runs the speed check again on his computer and Pixel, at a boss with a crowd in the Mist.
2. **4d, the game**, in `lantern-box/games/gloam-hallow/`: the first playable version, then the second loop and Hysteria.
3. **4e, the website**: a card for Gloam Hallow showing The Wandering Rot's best wisps. The website itself does not change for Hysteria.

## What could not be checked

The scores, lengths and rates above are worked out from Barney's answers, not measured: no game exists yet. How long a place really takes, how the crowds feel, and the speed with eight monsters, a boss and its glow on the Pixel can only be found by playing on his devices.
