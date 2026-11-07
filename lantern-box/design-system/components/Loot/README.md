# Loot

What a defeated monster drops: health potion, mana potion, the heal and fireball scrolls, the sword (longer reach), the rune stone (stronger hits), armour. Agreed in step 4b round 4.

## Code
`play.js`: `drawLoot(ctx, kind, X, Y, t, o)`, `drawLootDrop`, `drawLootPick`; kinds in `LOOT`.

## Rules
- Each is an ink cut-out with a glowing part in its own colour and a clue besides colour: its outline and an emblem that matches the HUD (the heart, the flame, the spell's picture, the rune).
- It stays until picked up or left behind off the screen; it never times out or blinks. A potion picked up goes into its socket if that is empty (Potions); if the socket is full, it is drunk if he needs it and left on the ground for later if he doesn't (version 11).
- Drop: hops out and bounces once (0.45 s). Pick-up: lifts into his chest, a gold glint and a ring of motes (0.5 s).

## Version 11
- A potion kept flies up to its socket instead of into his chest: it lifts and flies there, shrinking (0.45 s), and the socket fills (Potions). The other loot, and a potion drunk at once, lift into his chest as before.

## Version 12
- Potions picked up fill any empty socket bought, up to three of each (Potions). The scrolls teach the spell chosen at the Echo Shrine for this run: the fireball, the lightning bolt or the acid spray (Spells).

## Version 13
- **Armour** stays on the ground when all three pips are full, as a potion does when its sockets are full; it is never lost to a hit (HUD).
- **The bolt's and the acid's scrolls** are drawn in the scroll's own style, not shrunk from the Echo Shrine's pictures: the bolt's zigzag and the acid's spray with three drops, in the scroll's glowing part (`lootShape`, `lSpellPic`; the Spells card's "Scrolls" canvas).
- **The scroll on the path**: once a run, a scroll for the run's attack spell lies on open ground in Night's section B, about 40% of the way through the place and never beside a pit (starting figures). It is an ordinary scroll, with its usual pulse and "Fireball mastered" (or the bolt's or acid's) when picked up, so every run gets its spell early, first runs included. It isn't placed again on the second loop. Barney chose a scroll on the path on 7 November 2026, because scrolls otherwise come only from walkers (from Dawn) and bosses; what it teaches and where it lies are starting figures, agreed by Barney.
