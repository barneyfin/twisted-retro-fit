# Moves

The wanderer's moves as a posable card puppet: walk, jump, climb, the dodge roll, the sword, cast, hurt with the second of safety, and the life lost. Agreed in step 4b rounds 1 and 2 (Barney, 3 November 2026).

## When to use
- Always: the wanderer in play. The figure is round 1b's pilgrim: pointed hood, knee cloak, the lantern on a hook off the front of his belt, and the long red tie belt (knotted at the back, two tails trailing) in place of the scarf (PRD question 8, settled).

## Code
`play.js`: `mvDraw(ctx, X, Y, pose, tq, facing, edge, k, o)` draws him with his feet at (X, Y); the poses are in `PS`, `PJ`, `PR`, `PU`, `PL` (ready and strike, jump, roll, hurt, life lost) and `mvWalk(step)`, `mvIdle(step)`. `mvShatter`, `fxShards`, `fxEmber`, `fxSlash` draw the effects. The loops `loopWalk` to `loopLife` (and `loopDodge`) are the timing reference.

## The game provides
- Where he is and what he is doing; the kit draws the pose, his lantern swinging, the belt tails blown by his speed.

## Rules
- Puppet steps: the poses change in steps (12 a second), never tweened smoothly; the walk is 12 steps.
- Hurt: knocked back a step; every hit throws ember sparks (version 13: armour no longer drops card shards; it takes 10% off each hit per pip); then a second of safety, his lit edge pulsing slowly (1.5 a second). Nothing flashes.
- The life lost: hit, buckle, kneel, then he breaks into his card pieces, gold-edged (1.1 s), and the fade.
- The sword's upgrades: longer reach lengthens the swing's arc; stronger hits brighten its edge.
