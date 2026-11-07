# Moments

The moments from the gameplay note that join the World and the HUD: hits and a life lost (or a fall into a pit), the return at the checkpoint, and the end of a place. Agreed in step 4b round 10.

## Code
`play.js`: `loopLost` (hits, or the pit with `LOST_MODE = "pit"`) and `loopEnd` (the end of a place and its card) leave the HUD's state in `K.hs` for `HUD.set`.

## Rules
- A hit: ember sparks and the health bar drops a step; with armour, the step is smaller and a brass glint crosses the HUD's pips (version 13: no pip cracks and no card shards fall for a hit). Each knocks him back a step, with the slow pulse.
- A life lost: he buckles, kneels and breaks into card pieces (in a pit, as he falls); his lantern in the HUD gutters out; the fade (2 s, play stopped). At the checkpoint its lantern sends a gold spark back to his and he forms again in its light while health and mana refill in steps; the armour is gone.
- About 40% of the monsters beaten since the checkpoint come back (a starting figure); loot picked up stays picked up. A life lost in a boss fight restarts at its door, the boss at full health.
- The end of a place: the boss falls (card pieces, the large golden wisp, +25 wisps), its drop lands, the camera lets go, he walks on out to the right, and the place card follows.

## Version 12
- The boss's golden wisp gives 25 echo (the word changes, PRD question 12), with the echo sound (Sound). A life lost on the last life leads to the run's end (RunEnd); in The Echo Infusion at Full Launch, the revive offer may come first (AdPlaces). After each of the first three bosses the place card holds for the Grace pick (GracePick).

## Version 13
- Armour is kept all run; as the last life goes, the HUD's pips crack in turn, the last first, 0.12 s apart, with his card pieces, then the run's end (RunEnd) with the game-over toll (Sound).
- A hit Lantern Ward ignores: no knockback and no damage; the lantern flares gold, a ring of ten gold motes opens from it, the ward chime plays, and the second of safety's pulse follows as after any hit (`fxWard`, GracePick).

## Version 13: the second loop
- **Marked** only by the place cards' "Again, harder" under each name (PlaceCard); nothing on the HUD.
- **The order**: each place opens with its own section A, the gentle start by the checkpoint; only the sections after it are shuffled (Barney).
- **The Graces** held carry on, with no new picks (GracePick).
- **Harder, as built** (starting figures for 5f): monsters take 1.5 times the hits and move 1.2 times faster; bosses have 1.5 times the health; echo is doubled. The scroll on the path isn't placed again.
- **The win** after it has no offer and its own words, Barney's: "A monstrous glory.", "The greater horrors have bled dry.", "Gloam Hallow now fears your tread." (WinCard).
