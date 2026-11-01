# Bosses

One boss per place, the only cut-outs in colour: coloured from their level, wrapped in its glow, with ember detail, moving in the same angular steps. Defeated, a boss breaks into card pieces and a large golden wisp rises.

## When to use
- At the end of each place's level: Night, the veiled ghost; Blood-red rain, the tentacled skull; Dawn, the cauldron witch; Mist, the gaping tree. What each does is decided with Gloam Hallow's gameplay.

## Code
```js
W.drawBosses(canvas, t, { level: "dawn", rm });   // the wanderer and the boss; a 7.5 s loop, defeated from 4.8 s to 7 s
W.parts.bossInto(c, s, level, t, W.options(level), dx, dy);   // one boss, origin at (dx + 230s, dy + 300s)
W.parts.bossDefeat(c, M, s, X, Y, u /* 0..1 */, seed);        // its card pieces and the golden wisp
```

## The game provides
- The place, the boss's position and time, and the defeat's progress.

## Rules
- Larger than the monsters but no taller than the walker; colours from `boss-night-*`, `boss-storm-*`, `boss-dawn-*`, `boss-mist-*`, stronger than the level's own.
- Each glows in its level's colour (`boss-night-aura` …), fading in and out slowly. The ghost and the skull keep a thin ember outline; the witch and the tree do not. The gaping tree is rooted, with branch arms, windswept to the right; its glow is brighter so it shows against the pale mist.
- The witch's fire flickers slowly. Nothing flickers more than 3 times a second.
- Defeat: card pieces (4 by 3) tumble and fade as the glow fades; a large golden wisp (`wisp-gold`, glow `wisp-gold-glow` through `gold-light`) rises.
