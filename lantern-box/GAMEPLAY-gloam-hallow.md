# Gloam Hallow: the gameplay (PRD question 6)

Written 3 November 2026 in Barney's Claude app project, *Browser Arcade*, from his answers in the step 4a interview. The interview is in his vault note (`AI Projects/Browser Arcade/Gloam Hallow.md`, now frozen), where every answer is dated. This note answers PRD question 6 (the gameplay) and the rest of question 7 (which places get which track). It also lists what the design system needs before the kit can be changed and the game built: that design work is step 4b, done in the Claude app project first (the last section but two).

Every number marked *starting figure* is Barney's first guess, to be tuned once he has played the game on his computer and Pixel.

**Updated 7 November 2026 for phase 5** (the portal-readiness PRD, approved 7 November 2026; step 5b's design rounds 1 to 3; design system version 12). The changes: wisps are renamed echo, and echo is banked between runs ("stolen echo") and spent at the Echo Shrine; two ways to start (The Bare Reckoning, scored, and The Echo Infusion, not scored); the lightning bolt and the acid spray; up to three potions of each; belts; Graces after each boss; a daily bonus; teaching in play; the run's end; Settings' Credits and Clear saved progress; the win's three lines; the second loop built now; Hysteria an Echo Shrine unlock, built after submission; P and Backspace instead of Esc. Where this note and design system 12 differ, the design system is the spec. The note as it stood before this update is in git (commit 0591929).

## The game in a few lines

A hooded wanderer with a lantern and a sword fights through four places in one night and the next day: The Graveyard (Night), The Old Town (Blood Red Rain), The Open Moor (Dawn) and The Wind Bent Forest (Mist); the places' names are proper names, capitalised, without hyphens (Barney, 4 November 2026, step 4b round 10). The way forward is mostly fighting, over ground that rolls up and down in hills and steep banks; small pieces to stand on and climb (walls, tombs, crates, stumps, stones) hold loot and potions. Defeated monsters break into card pieces, their wisps rise to the score, and they sometimes drop loot; each wisp gives echo, the score (wisps until phase 5: the wisp still rises, only the word for what it gives changed). Each place ends with its boss, and after each of the first three a Grace is bound for the rest of the run. Beating the fourth, The Gaping Tree, is a win. Health, three lives and armour keep you going; heal and the chosen attack spell (fireball, lightning bolt or acid spray) cost mana. No timer. When a run ends, its echo is kept ("stolen echo") and spent at the Echo Shrine on spells, potion sockets and belts, kept for good.

## Modes

Phase 5 (PRD question 2 and design round 1, Barney, 7 November 2026). The journey is the same in each: Night to The Gaping Tree. **Until anything is bought at the Echo Shrine there is one start and no modes screen**: Start game goes straight into The Bare Reckoning. Once anything is bought, Start game opens the choice of run (the modes screen, headed "Choose a run"). Play again repeats the run just played.

| Run | Its words (Barney) | What it is |
|---|---|---|
| The Bare Reckoning | "Stripped of all favour, face the dark with naked steel alone. Your agony is etched into history." | Scored, on the high scores. A fixed loadout: the chosen attack spell and belt, and one potion of each kind, whatever else was bought (arcade decision B: one fair table, as CrazyGames allows one leaderboard per game) |
| The Echo Infusion | "Gorged on stolen power. Unleash your full arsenal, but expect no immortalisation." | Everything bought (every potion socket). Not on the high scores. Its first run each day earns double echo (The score). The revive, at Full Launch only, is offered here and never in The Bare Reckoning |
| Hysteria (*after submission*) | "No breath wasted. No blood spared. Time will not wait for your terror." | "Beat the clock as fast as possible; wisps don't count" (Barney). Night to the Mist's boss once, every boss beaten, 3 lives; the clock never stops, through deaths and restarts; game over leaves no time. Its own table lists the fastest times first. **An Echo Shrine unlock, 500 echo** (Barney, 7 November 2026), instead of unlocking after the second loop. Built after submission, as an update; until then the Echo Shrine and the choice of run show it locked, "Coming soon · 500" |

The modes screen's earlier mode, The Wandering Rot, gives way to these two runs; its name stays in Barney's line on the win screen ("Fell The Wandering Rot to begin anew…"). The website's card shows The Bare Reckoning's best echo.

**Saving** (phase 5, PRD question 1; arcade decision A, Barney, 7 November 2026). Besides the arcade's shared settings and the per-game high scores, one versioned record, read and written through one storage function (the kit's, which can't crash when storage is refused): the stolen echo; what has been bought (potion sockets, spells, belts, later Hysteria); the chosen attack spell and the belt worn; whether the first run has been played and whether the hints were hidden; the furthest place reached (for the run's end's "Furthest yet"); the date of the last doubled Echo Infusion run. A run still always starts at Night: nothing about a run in progress is saved. **Clear saved progress** (Settings) removes this record, Hysteria included, and the first-run hints come back; high scores and settings stay. Hysteria's times stay in the game. The kit's shell sorts every table highest first and the website's card shows the highest number across a game's tables, so Hysteria's table must list the fastest first and a time never becomes the card's best. The website itself does not change (Barney, 3 November 2026).

## Moving, fighting and the controls

- **Actions**: walk, jump, climb up a steep bank or onto a tall piece, swing the sword, cast the chosen spell (it costs mana), switch between the spells found, dodge roll, drink a kept potion, pause.
- **Keyboard**: WASD or the arrows move (W or up climbs a steep bank or a tall piece; S or down does nothing, as nothing is dropped through); Space jumps; J attacks; K casts the chosen spell; L switches spell; left Shift rolls; Q drinks a kept health potion and E a kept mana potion (step 4b round 13); P pauses; Backspace goes back in menus; H hides the first-run hints. **Never Esc in a hint** (phase 5): portals keep Escape for leaving full screen (CrazyGames' quality guidelines), so the CrazyGames build never listens for it; the arcade's own build may still answer it, unshown. Keys are bound by their place on the keyboard, and keycaps show the player's own letters where the browser can tell (an AZERTY player sees Z Q S D).
- **Phone, held sideways**: the left thumb has a stick that appears where it touches, anywhere in the left half of the screen, and goes when it lifts (nothing shows at rest): left and right walk, up climbs, down does nothing, and a quick flick rolls, as does a double tap (two short, still taps, each under 0.25 s and moving under 14 px, the second within 0.3 s and 70 px of the first: Barney's trial in kit 0.8.2, kept in step 4b round 13). The stick is an octagon with chevrons for left, right and up only. The right thumb has three buttons in a triangle: jump and attack, and above them cast, which shows the chosen spell's picture. Switching spells is a tap on the chosen spell's picture beside the mana bar (step 4b round 9; Barney, 4 November 2026). Drinking a kept potion is a tap on its socket, top left (round 13); like the spell's picture, a tap there never starts the stick.
- **No touch hint** in later runs. A "?" tile beside the pause tile, on phones and computers, opens a minimal how-to-play page with the game paused. The title menu gains "How to play" for the same page.
- **Teaching in play** (phase 5, design round 2): on a first run, and again after Clear saved progress, the controls are shown during Night, mostly pictures. On a computer, A D walk, Space jump and J attack in a row above the path at the start; K cast, Shift roll and Q E drink later, the first time each matters. On a phone, the stick's half outlined ("Touch and drag here to move", "Flick to roll"), Jump and Attack ringed and named, "Cast, once a spell is learnt". Each hint dims as soon as its control is used and goes after a second; the next to learn is edged in gold. H, or Hide hints, hides them all for good. They never stop play, flash or cover the HUD.
- **Clashes to watch**: a quick change of direction could read as a flick and roll by mistake (the flick needs a clear threshold, tuned in play). Up on the stick climbs only at a steep bank or a tall piece; it never jumps.

## Places, checkpoints and the run

- **The places, in order**: Night, Blood Red Rain, Dawn, Mist. Each takes about **5 minutes** (*starting figure*) and ends at its boss. A run takes about 25 minutes. Between places, the place card (below) fades through black.
- **The ground** (step 4b round 5; Barney, 4 November 2026): the play layer's floor rolls up and down, never below today's floor: hills up to about half the screen on the moor, about 35 to 40% in the graveyard and the forest, and about 25% in the old town, all with small undulations. A few steep banks (a jump below about 70 high, a climb up to about 130) and pits in the dips (about 45 wide). The camera follows the wanderer along and up, so the layers rise at their own rates (PRD question 5).
- **Hill sections**: each place's level is a flat start, then **ten sections** in the place's own **fixed order**, never the same one twice running, then its boss arena, which is **flat**. Seven section shapes, each starting and ending on the floor, their heights a share of the place's maximum: ripples; a long climb with a crag drop; a bank and plateau; a pit in a dip; the big hill; terraces; a mound between two pits. About 10,600 long in all (*starting figures*: the lengths, heights and orders, in the design system).
- **The sky's flyers** (step 4b round 12; Barney, 4 November 2026): bats at Night and in Blood Red Rain; crows by day. On the moor, two flocks of crows cross the far sky from left to right, as the night's bat swarms do the other way, and three bigger crows fly alone nearer; the Mist has three far crows. The crows are drawn side on, beating their wings like the bats, with a long body, a heavy beak and a fanned tail. In the Mist, leaves blow across from left to right in gusts, tumbling, far and near, never in front of the path.
- **Small pieces** to stand on and climb, each with a lit top edge; the wanderer walks off the end (nothing is dropped through). Graveyard: the arched churchyard wall, a box tomb. Old town: barrels, big crates, a handcart. Moor: the drystone wall, the dolmen, boulders, the cairn. Forest: the fallen trunk, a small stump, the great stump, a mossy rock. No more kinds are needed (Barney). They sit on the sections' crests and plateaus.
- **Checkpoints**: the start of each place, once halfway through it (after the fifth section), and at the boss's door. No pit from 120 before a checkpoint to 320 after it (Barney, 5 November 2026; kit 0.9.1, and design system 12 since), so Night, Blood Red Rain and Dawn have three pits each and the Mist four. Each is a lantern on a post that lights as the wanderer passes, and stays lit: the wanderer's own lantern made big, on a post that belongs to the place (graveyard, a wrought-iron crook on a stone plinth; old town, a timber post with an iron sign bracket; moor, a gnarled stake in a cairn; forest, a sapling pole bent over). The boss's door has the same checkpoint (step 4b round 6; Barney, 4 November 2026).
- **Lives**: **3** for the run (*starting figure*). When health empties or the wanderer falls into a pit, a life is lost and the run restarts at the last checkpoint. About **40%** (*starting figure*) of the monsters beaten since that checkpoint come back, so a restart has consequences without being a grind; loot picked up stays picked up. A life lost in a boss fight restarts at the boss's door, the boss at full health (Barney, 4 November 2026, step 4b round 10). **Game over** comes when the lives run out. Game over loses everything (arcade-style).
- **A lost life** refills health and mana. Spells learnt, sword upgrades and armour are kept (armour since Barney's play of step 5d, 7 November 2026).
- **Game over** (phase 5): the run's end. The run's echo is banked as stolen echo, whatever happened; the score stays this run's echo, and spending never lowers a high score.
- **The win**: beating The Gaping Tree. The win screen counts the lives bonus into the score.
- **The second loop** (built before submission, PRD question 8): the win screen offers "Go round again". The same run carries on at Night, harder, with the score still counting; each place's hill sections are shuffled. It is the reward for finishing; it no longer unlocks Hysteria.
- **No timer** in The Wandering Rot.

## Health, mana, armour

- **Health** is the HUD's bar. **Armour** is shield pips continuing the health line: the slots are always shown as faint outlines, each piece found fills one, up to **3** (*starting figure*). Since Barney's play of step 5d (7 November 2026), each pip held takes **10%** off every hit (*starting figure*; three take 30%), and no pip is lost to a hit: armour lasts until the run ends, through a lost life too, and shatters as the last life goes. (It was: a hit takes a pip before any health.)
- **Mana** pays for spells. It slowly refills on its own; mana potions refill it faster.
- **Not enough mana**: casting without enough mana casts nothing; the hand's light sputters out in a puff of smoke, so the player knows the button worked (Barney, 4 November 2026, step 4b round 3). While mana is short of the chosen spell's cost, its picture in the HUD dims (step 4b round 9).
- **Spells**: heal, and one attack spell, chosen at the Echo Shrine before a run: the fireball to start, the lightning bolt and the acid spray bought (PRD questions 3 and 5). That run's scrolls teach the chosen one; the first scroll for a spell teaches it, later scrolls make it stronger; L or a tap switches between heal and the attack spell. The fireball flies at chest height, so it passes over crawlers (the sword's job) and answers the ghoul's long reach; it flies straight until it hits a monster or leaves the screen (Barney, 4 November 2026, step 4b round 3).
- **The new spells** (design round 3, Barney, 7 November 2026): a different effect, not more power, each costing the fireball's mana. The **lightning bolt** strikes the nearest monster ahead at once (about 5 body-lengths, *starting figure*) and forks to one more within about 2; each hit about two-thirds of a fireball's (*starting figure*). The **acid spray** hits everything in a short cone (about 2 body-lengths), crawlers too, and leaves a patch on the ground that hisses for 1.5 s and hurts whatever walks through: about a fireball's damage in all, spread over time (*starting figures*). Both are gold, as every spell; the bolt's fork zigzags as sharply as its strike. As built in step 5e-2 (*starting figures*; a body-length is his height): the bolt reaches 5 body-lengths, forks within 2, 0.06 s later, and hits for 1.33, 2 and 2.67 by level (the fireball 2, 3, 4); the acid's spray reaches 2 body-lengths ahead and hits for half a fireball's, its patch lies from half a body-length ahead to two and does the other half over 1.5 s, every 0.25 s. Their scrolls: "Lightning bolt mastered", "Lightning bolt: strikes harder", "Acid spray mastered", "Acid spray: burns deeper" (Barney). The concept is agreed; the execution has to be good, so both are judged in play before they're tuned.
- **The sword**: one sword that gets better. Each upgrade gives longer reach or stronger hits. The two kinds of upgrade look different on the ground (a sword for longer reach, a rune stone for stronger hits), so the player can see which it is (Barney, 4 November 2026, step 4b round 4).
- Not decided yet; Claude Code sets starting values for Barney to tune: how much health a heal restores and what it costs; the fireball's damage, cost and speed; the mana refill rate; the health lost to each monster's hit; how many sword and spell levels there are.

## The score: echo

Wisps were renamed echo on 7 November 2026 (PRD question 12): echo has no plural ("118 echo"); the bank is "Stolen echo"; the wisp shop is the Echo Shrine. Only the word changes: the wisp still rises from a defeated monster.

| Defeat | Echo (*starting figures*) |
|---|---|
| A small monster (crawler, flyer) | 1 |
| A medium monster (mouth-hat, ghoul) | 2 |
| A large monster (walker) | 5 |
| A boss | 25 |
| Each life left at the win | 10 |
| The second loop | all doubled |

The HUD counter shows four digits, so a run (and its second loop) must stay under 10,000. Claude's estimate, worked out rather than measured: a run of four places should come to roughly 400 to 500 echo, and 1,500 to 2,000 with the second loop. (The first playable version scored about 275 to 305 on the scripted player.)

- **Banked**: every run's echo is added to the stolen echo when the run ends, in either run. The score on the high scores is The Bare Reckoning's run echo only.
- **The daily bonus** (design round 2): the first Echo Infusion run of each day earns double echo. It doubles only what that run earns, never the stored total, and never applies to The Bare Reckoning, so the high scores stay fair. No streak: missing a day loses nothing.
- **Step 5d's answers** (Barney, 7 November 2026): a run left by Restart or Quit to menu banks its echo too, without the run's end, and uses up neither the day's doubled run nor the first run. "Furthest yet" compares places only (the win counts as beyond the Mist) and never shows on the very first run, which has nothing to beat. A first run that makes the top ten goes Continue, the initials and the table, as any top-ten score; the table's buttons are then Spend your echo, Play again and Menu. Clear saved progress is offered from the title's Settings only, so a run in progress never outlives its record. Until step 5e builds the Echo Shrine, its button opens a stand-in plaque (the stolen echo and "Coming soon"). For 5e: a fifth item in the title's arch for the shrine, if it fits.
- **Starting figures** (step 5d): a boss's golden wisp's echo sounds as its 25 are counted, 1.2 s after its defeat; the boss's share left on the run's end rounds up ("12% left", never 0%); the defeat and echo sounds' levels (kit 0.10.1's GAIN: the card tear as before, the echo at its own level, its first note about 5 dB over the tear as the old rising note was, louder in turn for 2, 5 and a boss's 25). The day of the daily bonus is the device's date when the run ends; a run that earns nothing doesn't use it up.

## The Echo Shrine

Phase 5 (PRD question 3; design round 1, Barney, 7 November 2026). From the title menu (in High scores' old place in the arch) and the run's end; only the very first run's end makes it the primary button, and nothing comes before a first run. Everything is bought for good; the spell and the belt can be changed there before any run. A spell or belt bought is chosen or worn at once (step 5e-1, Claude's choice; one press chooses another bought one). Anything affordable can be bought in any order; a third potion socket needs the second first. The run's end shows the cheapest thing not yet bought as "Next".

| Unlock | Starting price (echo; tuned at step 5f) |
|---|---|
| Second health potion socket (the first unlock) | 25 |
| Lightning bolt | 75 |
| Night blue belt | 100 |
| Second mana potion socket | 175 |
| Mulberry belt | 250 |
| Ash belt | 250 |
| Acid spray | 300 |
| Third health potion socket | 350 |
| Third mana potion socket | 400 |
| Hysteria (*after submission*; shown "Coming soon · 500" until then) | 500 |

The first nine come to 1,925; with Hysteria, 2,425. The first costs less than a poor first run earns, then one about every two or three runs.

- **Belts** (PRD question 6; design round 2): red to start; night blue, mulberry and ash, lightened to match the red's contrast on black and checked on the Pixel. Belt colours only for now, kept off the colours that already mean something (ember, gold, witch-green, the wisps' pale). A later release looks at a glow on the belt, the lantern's glass and the cloak's edge.

## Graces

Phase 5 (PRD question 7; design round 2, Barney, 7 November 2026). After each of the first three bosses, as the next place's card comes up, the card holds, play stopped, for "Bind a twisted Grace": a free pick of one of three, drawn at random from the deck, never one already held. Three picks a run, none before Night. Each lasts for that run only. No Grace touches echo. **Rarer Graces** (Barney, 7 November 2026, for step 5e): some cards should have really good benefits, to bring players back for one more run, and be rarer: each card gets its own chance of being among the three offered (a weight), so the strongest turn up less often. Which cards and how rare: to design with 5e. Iron Skin stays as it is.

| Grace | What it does |
|---|---|
| Keen Edge | Your sword bites deeper. |
| Long Reach | Your sword reaches further. |
| Deep Well | Mana refills twice as fast. |
| Iron Skin | Start every place with full armour. |
| Fleet Foot | Rolls recover faster. |
| Kindled Heal | Heal restores more. |
| Spell Surge | Your attack spell costs less mana. |
| Lantern Ward | The first hit in each place is ignored. |

Not decided yet; Claude Code sets starting values for Barney to tune: how much deeper, further, faster and less. As built in step 5e-3 (*starting figures*): Keen Edge one sword bite level more (half a blow); Long Reach one reach level more (9 lines); Deep Well mana twice as fast; Iron Skin full armour at once and at the start of each place; Fleet Foot rolls 1.3 times quicker over the same ground; Kindled Heal 15% of health more; Spell Surge the attack spell at 70% of its mana; Lantern Ward the first hit in each place ignored. Weights: Keen Edge, Long Reach, Fleet Foot 3; Kindled Heal, Spell Surge 2; Deep Well, Iron Skin, Lantern Ward 1 (a common card is among the three about half the time, a rare one about a fifth). At Full Launch only, an ad offers a second pick at the same moment, so nothing comes only from an ad.

## Monsters

Their looks are in the design system (version 7: graded black card, ember eyes and rim). Hits to defeat are *starting figures*. All hurt on touch as well as by their attacks. **Every attack is signalled first** (step 4b round 7; Barney, 4 November 2026): the monster winds up for about 0.35 to 0.5 s (*starting figure*) while its eyes flare and the part that will hurt burns hotter (the mouth, the claws, the walker's hollow chest); a sweep leaves a short ember trail; a recovery after each attack is the opening to strike. A one-hit monster breaks into card pieces as soon as it is hit.

| Monster | Size | What it does | Hits |
|---|---|---|---|
| Crawler | Small | Scuttles along the ground in bursts; crouches, then lunges low at your feet and carries on past: jump it, or strike low | 1 |
| Flyer | Small | Hangs with its wings folding, then swoops down to chest height and climbs away: roll under it, or strike it | 1 |
| Mouth-hat | Medium | Hops towards you; squats with its mouth gaping, then hops in and bites: stay just out of reach, then strike | 2 |
| Ghoul | Medium | Lurches in; draws its arm back over its head, then lurches about 30 forward as it swipes over and down, reaching about 114 from where it stood (the sword reaches about 84): roll through under it, then strike while it recovers (round 13) | 3 |
| Walker | Large | Stalks slowly and sweeps its branch arms: arms up means a high sweep that passes over him standing, so stay down (don't jump), or roll; a crouch with arms back means a low sweep (jump) (round 13) | 5 |

In the game, monsters turn to face the wanderer (Barney, step 4d; recorded in the design system in round 13).

## Bosses

One at the end of each place. A fight lasts about **a minute** (*starting figure*). Each boss has three attacks, and every big attack is signalled first so it can be learnt (step 4b round 8; Barney, 4 November 2026): a wind-up while its eyes flare and the part that will hurt burns; anything that comes up from or down onto the ground is marked first by an ember warning where it will land (a glowing patch with light rising from it; cracks for the tree's roots). In the game a boss chooses among its attacks. A hit: the boss jolts back, its ember rim flares once and the bar drops. The bosses' names are names, so each word is capitalised. Their looks are in the design system (version 7). A boss's health shows as a bar (see On screen).

| Place | Boss | Its three attacks |
|---|---|---|
| Night | The Veiled Ghost | Rears back, then glides at you with its hooked claws (roll under); fades out and reappears behind you (keep moving); rises and wails, a wave of pale fire rolling out along the ground both ways (jump it) |
| Blood Red Rain | The Tentacled Skull | Slams tentacles down from either side onto ember warnings on the ground (get off the glow); draws back and snaps its jaw when you are close (roll away); rises and calls up crawlers through cracked warnings (fight them) |
| Dawn | The Moor Mother | Crouches, then leaps right over you on her spider legs (roll under); raises her sickle behind her, then lunges and sweeps it along the ground (jump it); her shoulder eyes swell, then spit a spread of ember bolts (roll through) |
| Mist | The Gaping Tree | Rooted, never moves: the ground cracks and glows, then roots burst up through it (get off the cracks); a side branch burns, then a long crooked branch grows out of the trunk and sweeps across at head height, all the way out (roll under; round 13); its maw burns, then spits a fan of splinters (roll through) |

A defeated boss always drops a sword upgrade or a spell scroll, besides its golden wisp.

## How it gets harder (*starting figures*)

| Stage | What changes |
|---|---|
| Night | Small and medium monsters |
| Blood Red Rain | More kinds, more at once |
| Dawn | The walkers join |
| Mist | The most at once: up to **8** on screen (the speed test's crowd) |
| Second loop | Monsters take more hits and come faster; echo doubled; each place's hill sections shuffled |

## Loot

Dropped where a monster fell; picked up by touching it. Decided in step 4b round 4 (Barney, 4 November 2026): loot stays until picked up or left behind off the screen, and never times out or blinks; a potion the wanderer doesn't need (health or mana already full) stays on the ground for later; and the places' scenery potions become real health potions, placed on the small pieces and on hilltops.

**Potions kept for later** (step 4b round 13; Barney, 5 November 2026), for the boss fights: potions can be kept, each kind in its own socket under the HUD's plaque, and drunk when the player chooses (a tap on the socket, Q or E). One of each to start; up to **three of each** once the sockets are bought at the Echo Shrine (phase 5, PRD question 4): the HUD keeps one socket per kind, with a pip under it for each socket bought, filled while a potion is in it (design round 3). The Bare Reckoning takes one of each; The Echo Infusion every socket bought. A potion picked up fills an empty socket; when all are full, it is drunk if he needs it and left on the ground for later if he doesn't. A kept potion can't be drunk while its bar is full. Drinking is instant, with no pose, so it works mid-fight.

| Loot | Effect | How often (*starting figures*) | Stacks? |
|---|---|---|---|
| Health potion | Refills some health | About 1 monster in 9 (Barney, 5 November 2026: 1 in 6 at first, 1 in 12 after his second play, 1 in 9 again in kit 0.9.1) | One kept, up to three with the sockets bought (phase 5) |
| Mana potion | Refills some mana | About 1 monster in 12 (as health) | One kept, up to three with the sockets bought (phase 5) |
| Spell scroll | The first teaches a spell (heal, or the attack spell chosen for the run); later ones make it stronger | Only from walkers, about 1 in 4; or a boss's sure drop | Yes, as spell levels |
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
| Armour lost at the run's end | Since step 5d armour isn't lost to a hit: as the last life goes, the armour shatters with the blow, each pip cracking in the HUD in turn, 0.12 s apart (*starting figure*), with a few card shards falling from the wanderer, all before the run's end at 0.8 s (Barney, 7 November 2026) | 0.4 s a pip | No |
| Monster hit | It jolts back a puppet step and its ember rim flares once | instant | No |
| Monster defeated | Card pieces and its pale wisp rising to the score (in the design system), with its echo sound | 1.6 s | No |
| Pick-up | The loot lifts into the wanderer with a gold glint; the bar fills | 0.5 s | No |
| Potion kept | The potion lifts and flies up to its socket, shrinking; the socket's flask grows in with one glint; the first time each kind is kept, a plaque line: "Kept for later. Tap to drink" on a phone, "Kept for later. Q to drink" or "E to drink" on a computer (round 13) | 0.45 s, then 0.4 s | No |
| Potion drunk | The socket's flask drains; motes in the potion's colour rise round him with a soft glow at his chest; the bar fills; the drink's sound (round 13) | 0.9 s | No |
| New spell or sword upgrade | A brass plaque line, centred under the HUD's top row (round 13; it was level with the plaque), with the item's picture: "Heal mastered" or "Fireball mastered" for a spell's first scroll; "Heal: restores deeper" or "Fireball: glows brighter" for a later one; "Sword: reaches beyond" or "Sword: bites deeper". Two at once take turns (step 4b round 10) | 2 s | No |
| Heal / fireball | A pale gold glow rises round the wanderer / a fireball in the lantern's gold that bursts where it hits (gold, not ember: ember is for danger only; Barney, 3 November 2026, step 4b round 2) | 0.5 s | No |
| Not enough mana | The hand's light pops into falling sparks and a puff of smoke; nothing is cast (step 4b round 3) | 0.6 s | No |
| Checkpoint | A gold spark leaps from the wanderer's lantern to the checkpoint's; its glass flares with a ring of motes, then glows gold | 0.5 s | No |
| Life lost (or a fall into a pit) | The wanderer buckles, kneels and breaks into card pieces, gold-edged (in a pit, he breaks up as he falls into the dark); his lantern in the HUD gutters out; fade to black; at the checkpoint, its lantern sends a gold spark back to his and he forms again in its light while health and mana refill in steps (step 4b round 10) | 2 s | Yes |
| Boss arrives | The camera locks; the boss comes in its own way (The Veiled Ghost fades in, The Tentacled Skull rises from the street, The Moor Mother strides in, The Gaping Tree tears up out of the ground); its name on a brass plaque centred under the HUD's top row, the rule under it (round 10; moved down in round 13); the boss bar fills | 2 s | Briefly |
| Boss defeated | Card pieces and the large golden wisp (in the design system); the boss bar fades; its drop lands. The camera lets go, and the wanderer walks on out of the arena to the right (round 10) | 2.2 s | No |
| Place cleared | When the wanderer walks on out of the arena: fade through black, the HUD with it, to a plaque with the next place's name over the rule and its words below ("Dawn" over "The Open Moor"); the next place fades up behind it. Night's card opens every run the same way, after the title screen (step 4b round 10) | 3 s | Yes |
| Grace pick | After each of the first three bosses, under the next place's card: three Graces; the card holds until one is taken (phase 5) | until chosen | Yes |
| The win | "A grim triumph.", "The flesh yields.", "Gloam Hallow remembers not your suffering.", one at a time with the win's three bells (0, 0.7, 1.4 s); then the score and the lives bonus counted in; then "Go round again" or Finish (phase 5) | until chosen | Yes |
| Second loop begins | Night again, a plaque: "Again, harder" | 2 s | No |
| The run's end | The last life falls as before but with no fade to black; the plaque at 0.8 s; this run's echo steps into the bar to the next unlock until 2.0 s (READY with a soft chime if one is reached); the buttons take input at 1.0 s (phase 5) | until chosen | Yes |
| Game over, new best | The run's end with NEW BEST, Continue, then the initials (in the design system) | until chosen | Yes |
| Revive (*Full Launch only*) | "Rise again?" before the run's end, once a session, The Echo Infusion only | 5 s countdown | Yes |

## On screen during play

Designed in step 4b round 9 (Barney, 4 November 2026).

- **Top left**, one plaque in three rows: the health bar with its heart and, continuing the line, the three armour slots (a shield pip fills each one held; since step 5d a hit leaves them, as they take a share off it); the mana bar with its flame; and one small gold lantern per life (a spent life's lantern stays, dark, so the player sees how many are left). At the right end, **the chosen spell's socket** (44 px): its picture; two small diamonds when two spells are known, the lit one chosen; empty and dim until the first spell is learnt; dimmed while mana is short of its cost. A tap on it switches spells on a phone (L on a computer); the picture turns over like a card.
- **The potion sockets** (round 13), 8 px under the plaque's left end: health then mana, each under its own bar, 40 px on a computer and 44 on a phone. Empty, a faint outline of the potion; kept, the potion in its bar's colours; kept while its bar is full, dimmed. On a computer, a small Q or E keycap on each socket's corner. Once a second socket is bought, pips under each socket, one per socket bought, filled while a potion is in it (phase 5).
- **The plaque line** (new spell, sword upgrade, a potion first kept) and the boss's name sit centred under the HUD's top row: 99 px down on a computer, 89 on a phone (round 13).
- **Top right**: full screen (computers only; never in the CrazyGames build), the "?" tile, the pause tile and the echo counter, ECHO over the number (in Hysteria, the clock instead: TIME over minutes and seconds, in the same plaque).
- **During a boss fight**: a long thin brass bar across the bottom middle (420 px on a computer; 300 px on a phone, between the thumbs) with the boss's name above it in IM Fell English, filled in ember; after a hit a lighter trace of what was lost drains away; gone when the fight ends.
- **On a phone**: the stick and buttons above. The HUD sits 12 px in and 10 px down, plus the phone's own safe margin where it has a camera hole. The camera holds the wanderer where it does on a computer.
- No progress line: the checkpoint lanterns mark the way.
- **A clue besides colour** (the vault note's section 11, settled here): health has the heart and the thicker bar; mana the flame and the thinner bar; armour a shield, solid when held and an outline when empty; lives a lantern, lit with a flame or dark; the spell its own picture, dimmed when mana is short; a kept potion its flask with the heart or the vial with the flame, an empty socket an outline (round 13); the boss bar the boss's name; loot its outline and emblem (round 4).
- **Small text on a phone** (section 11, settled here): no text in play under 12 px (so the ECHO label is 12 px on a phone, not 11), nothing the player must read mid-fight under 16 px, no icon under 12 px tall, no touch target under 44 px.

## Screens

Title (with "How to play" added to its menu as the second item: Start game, How to play, High scores, Settings; inside the same arch, the spacing tightens to fit four), pause, settings, game over, initials and high scores as the kit has them. Designed in step 4b round 11 (Barney, 4 November 2026). Added:
- **the how-to-play page**: a plaque headed How to play: the goal in Barney's two lines (under Words), then the controls: on a computer the keys with keycaps (A D or the arrows, walk; W or up, climb a bank; Space, jump; Shift, roll; J, attack; K, cast; L, switch spell; P, pause; Q, drink a health potion; E, drink a mana potion); on a phone, the stick and the three buttons drawn small with what each does ("flick or double tap to roll"), a tap on the spell to switch, and "Tap a potion, top left, to drink it" (round 13). From the "?" tile, play is paused behind it and its button is Resume (P does the same); from the title, Back (Backspace does the same);
- **the place card** between places, and before Night at the start of every run;
- **the win screen** (phase 5, design round 3): "A grim triumph." over Barney's two lines, the three appearing one at a time with the win's bells; the rule; the score in echo (NEW BEST when it beats the best); "Lives left" with a lantern per life, each one still lit adding its 10 in turn, half a second apart, the score stepping up with it; then Barney's line "Fell The Wandering Rot to begin anew—walk the cursed path once more against darker terrors." over Go round again (the primary button) and Finish. Finish goes on as game over does: Continue to the initials for a top-ten score, otherwise the run's end's buttons;
- **the run's end** (phase 5, design rounds 1 and 2), in place of the kit's game-over plaque: "Game over" over "The rot overcomes you, but your echo remains."; the run's echo large; one honest near-miss line ("Fell to The Tentacled Skull · 12% left", or "Furthest yet"); the first Echo Infusion run of the day's ×2 line; a bar to the next unlock ("Next: Acid spray · 86 to go", or READY); Play again (primary, focused), then Echo Shrine (lit when something is ready) and Menu. High scores moves into Menu. A top-ten score in The Bare Reckoning has only Continue. The very first run's end: "Your echo stays with you when a run ends. Spend it at the Echo Shrine." and "Spend your echo" as the primary button, once;
- **the Echo Shrine** (phase 5): three columns, the spell for the next run, the potions you can keep, the belt; the bank (STOLEN ECHO) top right; Hysteria locked underneath;
- **the choice of run** (phase 5, once anything is bought), headed "Choose a run": The Bare Reckoning, The Echo Infusion and Hysteria (locked, "Coming soon · 500 echo at the Echo Shrine"), each with Barney's words and what it takes;
- **the Grace pick** (phase 5) under the place card;
- **Settings** gains Credits and Clear saved progress (with its confirmation, "Clear saved progress?": Keep it, primary and focused, or Clear it); **Credits**: the studio's credit, "Music made with Google Gemini" with both tracks, the Pixabay sound effects, the two fonts and their licence (phase 5, design round 3);
- **the title menu**: the Echo Shrine takes High scores' place in the arch (Start game, How to play, Echo Shrine, Settings), and High scores becomes an arch tile beside the sound tile (Barney, 7 November 2026; a fifth item didn't fit the arch);
- **Hysteria's finish** (*later*): its two lines, then the time large in place of the score, to a tenth of a second (24:07.3), Continue to the initials when it is among the fastest ten, and its table of fastest times.

## Words

- Tone: dread, plain, no exclamation marks (the design system's tone). English only.
- **Win screens.** The win: "A grim triumph." over "The flesh yields." and "Gloam Hallow remembers not your suffering." (phase 5). Hysteria: "A blur of severed bones." over "You outran the gloam." Barney kept these as written: they are words only, and nothing on screen bleeds.
- **Phase 5's words** (Barney, 7 November 2026): "The rot overcomes you, but your echo remains." (under Game over); "Stolen echo"; "Echo Shrine"; the runs' words (Modes); "Bind a twisted Grace" and the Graces; "Rise again?", "Once each night, the lantern can be lit again.", "Watch an ad and rise", "No, end the run" (Full Launch only); "Hysteria" with "No breath wasted. No blood spared. Time will not wait for your terror.". Echo never takes a plural.
- **Plaque lines in play** (step 4b round 10; Barney, 4 November 2026): the place cards, each the place's name over its words, both proper names (Night: "The Graveyard"; Blood Red Rain: "The Old Town"; Dawn: "The Open Moor"; Mist: "The Wind Bent Forest"); the boss names; "Heal mastered", "Fireball mastered", "Heal: restores deeper", "Fireball: glows brighter", "Sword: reaches beyond", "Sword: bites deeper"; "Kept for later. Tap to drink" (phone), "Kept for later. Q to drink" and "Kept for later. E to drink" (computer), once per kind (round 13); "Again, harder" (later). "Hysteria unlocked" is on the win screen.
- **How to play** (Barney, 4 November 2026): "Cut your path through four blighted lands, felling the terror bound to each. Sever the roots of The Gaping Tree to break the night." over "Three chances to break the dark. Fall, and return to the glow of your last lit lantern."
- **Barney's line for the second loop** (4 November 2026, Hysteria's locked note until phase 5; it moved to the win screen's offer of the second loop on 7 November 2026): "Fell The Wandering Rot to begin anew—walk the cursed path once more against darker terrors."

## Sound

- **Soundtrack**: two MP3s from Barney (ARCADE.md allows two in a Lantern Box game). Track 1, *The Long Vigil* (`The_Long_Vigil.mp3`), plays for Night and Blood Red Rain; track 2, *Lantern in the Moor* (`Lantern_in_the_Moor.mp3`), for Dawn and the Mist (Barney, 4 November 2026). They switch at the place card before Dawn. A lost life leaves the music alone; a track restarts only when it begins again at a place card, so on the second loop track 1 starts again at Night. Barney keeps the files until the kit change.
- **Effects** (step 4b round 12; Barney, 4 November 2026), made in code as the kit makes its sounds (oscillators, filtered noise, bells, a little of a dark room behind them): sword swing (a quick whoosh) and hit (a blade's crack and a short metal ring), jump (a cloth flap) and land (a soft thud), roll, hurt, armour crack (a metal clang and a crunch), monster defeated (a card tear, then the wisp's echo: phase 5 turned the soft rising note into a short echo, louder and longer the more echo it gives: 1, 2, 5, and 25 for a boss's golden wisp after its bell), pick-up (two glints), a potion drunk (the cork, two quick swallows and a short warm chord rising, lower for health and brighter for mana; round 13), heal (a warm chord swelling), fireball (a fluttering roar of fire with crackles) and its burst (the same, bigger and longer), not enough mana (a spark and a hiss), checkpoint lantern (the spark and a small chime), the plaque line (a light chime), life lost (falling tones and scattering cards), boss arrives (a deep, growling swell), boss defeated (a deep bell), the place card (a low toll), the win (three bells). Lantern Box's menus have their own soft sounds (a muted tick, a soft chime, a falling tick), not the kit's square-wave blips.
- **Credits** (phase 5): "Music made with Google Gemini", never Barney as composer (PRD question 10); keep each track's creation date, prompts and account, and Google's terms as of 6 November 2026.
- **Two are recordings Barney supplied** (royalty-free, Pixabay; ARCADE.md allows short sound effects since 4 November 2026): the hurt is the first burst of a man's pain sound ("66 voz hombre dolido", Pixabay 100206), and the crows' caws are seven cut from "Crow sound effect HD" (Pixabay 336784), two to four in a call, each call pitched a touch apart. About 45 KB together.
- **Levels** are set by measured loudness: the big moments loudest, then the main actions, then light touches, then the menus; in each place, its bats, crows, creaks and thunder above its wind or rain (*starting figures*, to tune by ear).
- **Background sound**, quiet under the music: Night, wind and bats; Blood Red Rain, rain (made as City Nights makes its rain) and thunder (a ripping crack, then a long uneven roll); Dawn, moor wind and crows; Mist, creaking trees (often), wind in the leaves and crows.

## Scope

- **First playable version**: everything above except what is marked *later*. That means the four places in order with their monsters and bosses; The Wandering Rot through to the win screen; health, lives, armour and mana; heal and fireball; the loot; the rolling ground with its hill sections, small pieces and pits; checkpoints; the HUD with the boss bar; the "?" page; both tracks, the effects and the background sound; keyboard and phone controls.
- **Phase 5, before submission** (the PRD): saved progress, the run's end, the Echo Shrine and its unlocks, the two runs, the Graces, teaching in play, the daily bonus, Credits and Clear saved progress, the second loop, the CrazyGames build (no full-screen tile, Testing panel or arcade links; P and Backspace; the soundtracks at the end of the file), and the submission assets.
- **Later**: Hysteria, as an Echo Shrine unlock with its table of times (an update after submission); everything only Full Launch needs: the CrazyGames SDK, ads (the revive, double this run's echo, try a spell for one run, a second Grace, the banner), cloud save and the CrazyGames username.
- **Never**: blood on screen; more than the four places; gamepads (an arcade rule); online scores.

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
13. **From Barney's second play in step 4d** (round 13, design system version 11): the potion sockets and their moments, the drink's sound, the plaque line moved down, the double tap, the far layers lit through a cloud softened, the ghoul's lurch, the walker's "stay down, or roll", the Gaping Tree's branch at head height, monsters facing the wanderer. Done in round 13.
14. **Phase 5** (step 5b's design rounds 1 to 3, 7 November 2026; design system version 12): the rename to echo; the run's end; the Echo Shrine and the choice of run; the Graces; teaching in play; the daily bonus; the lightning bolt and the acid spray; three potions of each; the belts; Settings' new rows and Credits; the win's three lines; the Full Launch places, drawn only; P and Backspace; the echo sound. Done in step 5c.

## Phase 5, in Claude Code

After Barney approves design system 12 (`HANDOVER-design-12.md`): **5d**, saved progress, banked echo and the run's end (kit 0.10.0); **5e**, the Echo Shrine, the unlocks, the Graces and the second loop; **5f**, balance against real runs and three to five people playing it cold; **5g**, the CrazyGames build and the tests (browsers, the Pixel, the tablet, 60, 144 and 165 Hz, a private window). The checklist is `CRAZYGAMES-gloam-hallow.md`.

## Then, back in Claude Code (phase 4, done)

1. **4c, the kit change**, as its own job, from the refreshed design system: the parts above; the rolling ground and the camera rising with it; two soundtracks and the switch between them; the effects and background sounds. Then rebuild the test page and every Lantern Box game, and Barney runs the speed check again on his computer and Pixel, at a boss with a crowd in the Mist.
2. **4d, the game**, in `lantern-box/games/gloam-hallow/`: the first playable version, then the second loop and Hysteria.
3. **4e, the website**: a card for Gloam Hallow showing The Wandering Rot's best wisps (since phase 5, The Bare Reckoning's best echo). The website itself does not change for Hysteria.

## What could not be checked

The scores, lengths and rates above are worked out from Barney's answers, not measured: no game exists yet. How long a place really takes, how the crowds feel, and the speed with eight monsters, a boss and its glow on the Pixel can only be found by playing on his devices.
