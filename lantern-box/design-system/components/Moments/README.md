# Moments

The moments from the gameplay note that join the World and the HUD: hits and a life lost (or a fall into a pit), the return at the checkpoint, and the end of a place. Agreed in step 4b round 10.

## Code
`play.js`: `loopLost` (hits, or the pit with `LOST_MODE = "pit"`) and `loopEnd` (the end of a place and its card) leave the HUD's state in `K.hs` for `HUD.set`.

## Rules
- A hit with armour: card shards fall as a pip cracks. Without: ember sparks and the health bar drops a step. Each knocks him back a step, with the slow pulse.
- A life lost: he buckles, kneels and breaks into card pieces (in a pit, as he falls); his lantern in the HUD gutters out; the fade (2 s, play stopped). At the checkpoint its lantern sends a gold spark back to his and he forms again in its light while health and mana refill in steps; the armour is gone.
- About 40% of the monsters beaten since the checkpoint come back (a starting figure); loot picked up stays picked up. A life lost in a boss fight restarts at its door, the boss at full health.
- The end of a place: the boss falls (card pieces, the large golden wisp, +25 wisps), its drop lands, the camera lets go, he walks on out to the right, and the place card follows.
