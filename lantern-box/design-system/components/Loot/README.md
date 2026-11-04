# Loot

What a defeated monster drops: health potion, mana potion, the heal and fireball scrolls, the sword (longer reach), the rune stone (stronger hits), armour. Agreed in step 4b round 4.

## Code
`play.js`: `drawLoot(ctx, kind, X, Y, t, o)`, `drawLootDrop`, `drawLootPick`; kinds in `LOOT`.

## Rules
- Each is an ink cut-out with a glowing part in its own colour and a clue besides colour: its outline and an emblem that matches the HUD (the heart, the flame, the spell's picture, the rune).
- It stays until picked up or left behind off the screen; it never times out or blinks. A potion not needed stays for later.
- Drop: hops out and bounces once (0.45 s). Pick-up: lifts into his chest, a gold glint and a ring of motes (0.5 s).
