# Wanderer

The hooded wanderer: a black cut-out with a lantern, a thin lit edge from the place's light and one red. A stand-in, drawn to judge the look.

## When to use
- Gloam Hallow's hero, standing on the path. Its final design and moves are designed in step 4b with the rest of the play parts.

## Code
```js
W.drawWanderer(ctx, X, Y, t, walking, facing /* 1 or -1 */, rm, W.places[level].edge);
// (X, Y) is the point between the feet, in picture pixels; drawn at 1.32 times its unit size
```

## The game provides
- Where they stand, the time (the walk cycle runs at 7 steps a second's phase), whether they walk, which way they face, and the place (for the edge colour).

## Rules
- `ink` silhouette, edged 1.3px up and to the right in the place's light (`night-edge` …); the lantern's glass `lamp-glass` with a `lantern-glow` pool round it and a faint light at the feet; the scarf `wanderer-scarf`.
- The scarf is a stand-in: a hooded figure with a long red scarf is the traveller in *Journey* (2012). PRD question 8 is open; Barney's pencilled answer is no scarf and a long trailing red tie belt at the waist, settled in 4b.
- The hero is never ember: ember means danger.

## Version 8
- The long red tie belt (knotted at the back, two tails trailing) replaces the scarf: PRD question 8, settled in step 4b round 1b. His moves, poses and effects are in Moves (play.js).

## Version 12
- **Belts** (step 5b rounds 1 and 2, Barney, 7 November 2026): red to start (`wanderer-scarf`); night blue (`belt-night-blue`), mulberry (`belt-mulberry`) and ash (`belt-ash`) bought at the Echo Shrine and worn there before any run. Each was lightened to match the red's contrast on black (about 3 : 1; ash 5.7) and checked on the Pixel. Kept off the colours that already mean something (ember, gold, witch-green, wisp-pale), so the one-red rule relaxes to one belt. The game's puppet takes it from `play.js`'s `setBelt` (`BELTS`, `MV_RED`); the walk below shows each.
- **The card shows the game's wanderer** (Barney, 7 November 2026): the puppet from `play.js` (Moves), walking in each place's light, and then his four belts. Until version 11 it showed `LanternBox.world.drawWanderer`, step 4a's stand-in with the scarf, which `bundle.js` still carries (the Code section above) for the older world pages; it is not the design. The kit still has a copy of the stand-in for its scene's `walking` option and the boss sheets: anywhere a game shows him, it is the puppet.
