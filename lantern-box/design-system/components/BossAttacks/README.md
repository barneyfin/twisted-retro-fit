# BossAttacks

Each boss's arrival, its three attacks with their signals and counters, ground warnings, and a hit. Agreed in step 4b round 8.

## Code
`play.js`: `BS_FIGHT[lv](wx, G)` gives each fight's timeline; `bsDraw(ctx, K, s, lv, X, Y, t, opts, state)` draws the design system's boss (with `LP.BOSS_NOD` and `LP.BOSS_LOOK`, graded) moved as a card puppet, with extra parts (`bsTentacle`, the elbowed branch `bsBranchPts`, `bsWave`, `bsBolt`, `bsSplinter`); `bsWarn` the ground warnings. With `K.hud` set, the fight leaves its bar and name to the Interface (BossBar, PlaqueLine).

## Rules
- Names are names, capitalised: The Veiled Ghost, The Tentacled Skull, The Moor Mother, The Gaping Tree.
- Arrival (2 s): the camera locks; the ghost fades in, the skull rises from the street, the moor mother strides in, the tree tears up out of the ground; its name on a plaque; the bar fills.
- The ghost: the lunge (roll under), fade and reappear behind (keep moving; its signal a smooth fade to 62% and back over half a second), the wail, a wave of pale fire both ways (jump). The skull: tentacles slam onto ground warnings (get off the glow), the snap when close (roll away), crawlers called up through cracked warnings (fight them). The moor mother: the leap over you (roll under), the sickle swung along the ground (jump), the shoulder eyes' bolts (roll through). The tree: roots through glowing cracks (get off them), the long elbowed branch at head height (roll under), a fan of splinters (roll through to the trunk).
- Ground warnings: a glowing ember patch with light rising from it, cracks where set, drawn after the scene's fore layer. A hit: jolt, the rim flares once, the bar drops with a draining trace.

## Version 9
- The Veiled Ghost's "behind" signal (the night fight, 3.5 to 4.0 s) is a smooth fade out and back in, `alpha = 1 - 0.38 sin(πu)` over its half second, in place of version 8's flicker 8 times a second, which broke the limit of 3 flashes a second for anything bigger than a character (Barney, 4 November 2026). Everything else in the fight is unchanged.
