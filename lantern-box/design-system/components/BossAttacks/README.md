# BossAttacks

Each boss's arrival, its three attacks with their signals and counters, ground warnings, and a hit. Agreed in step 4b round 8.

## Code
`play.js`: `BS_FIGHT[lv](wx, G)` gives each fight's timeline; `bsDraw(ctx, K, s, lv, X, Y, t, opts, state)` draws the design system's boss (with `LP.BOSS_NOD` and `LP.BOSS_LOOK`, graded) moved as a card puppet, with extra parts (`bsTentacle`, the elbowed branch `bsBranchPts`, `bsWave`, `bsBolt`, `bsSplinter`); `bsWarn` the ground warnings. With `K.hud` set, the fight leaves its bar and name to the Interface (BossBar, PlaqueLine).

## Rules
- Names are names, capitalised: The Veiled Ghost, The Tentacled Skull, The Moor Mother, The Gaping Tree.
- Arrival (2 s): the camera locks; the ghost fades in, the skull rises from the street, the moor mother strides in, the tree tears up out of the ground; its name on a plaque; the bar fills.
- The ghost: the lunge (roll under), fade and reappear behind (keep moving; its signal a smooth fade to 62% and back over half a second), the wail, a wave of pale fire both ways (jump). The skull: tentacles slam onto ground warnings (get off the glow), the snap when close (roll away), crawlers called up through cracked warnings (fight them). The moor mother: the leap over you (roll under), the sickle swung along the ground (jump), the shoulder eyes' bolts (roll through). The tree: roots through glowing cracks (get off them), the long elbowed branch at head height, all the way out (roll under; version 11), a fan of splinters (roll through to the trunk).
- Ground warnings: a glowing ember patch with light rising from it, cracks where set, drawn after the scene's fore layer. A hit: jolt, the rim flares once, the bar drops with a draining trace.

## Version 9
- The Veiled Ghost's "behind" signal (the night fight, 3.5 to 4.0 s) is a smooth fade out and back in, `alpha = 1 - 0.38 sin(πu)` over its half second, in place of version 8's flicker 8 times a second, which broke the limit of 3 flashes a second for anything bigger than a character (Barney, 4 November 2026). Everything else in the fight is unchanged.

## Version 11
- **The Gaping Tree's long branch sweeps at head height** everywhere it reaches (Barney, round 13): it grows from 84 above the tree's foot (was 96), nearly level, still elbowed (its bends +0.18 and -0.28, were +0.42 and -0.36), and its swing ends at -3.20 (was -3.05). Across its reach it is 71 to 84 above the ground, against the wanderer's 100 to his hat, so he rolls under it wherever it reaches and a jump takes him into it. As drawn before, it passed over him more than about 120 from the trunk. The swing's timing is unchanged (`bsBranchPts`, `BS_FIGHT.mist`, `bsBranchFx`).
