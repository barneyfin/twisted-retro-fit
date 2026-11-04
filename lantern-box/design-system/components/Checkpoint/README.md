# Checkpoint

A lantern on a post that lights as the wanderer passes, and stays lit: his own lantern made big, on a post of the place's own. Agreed in step 4b round 6 (option B).

## Code
`play.js`: `cpDraw(ctx, "B", lv, X, Y, state, t)` returns the glass's centre; `cpState(s)` gives the lighting's timing; `cpSpark` the spark from his lantern.

## Rules
- At the start of each place, after its fifth section, and at the boss's door.
- Posts: Night a wrought-iron crook on a stone plinth; Blood Red Rain a timber post with an iron sign bracket; Dawn a gnarled stake in a cairn; Mist a sapling pole bent over.
- Lighting (0.5 s): a gold spark leaps from his lantern to its glass (0 to 0.18 s), the glass flares with a ring of motes, then glows gold. After a life lost, its spark comes back down to his lantern and he forms again in its light (Moments).
