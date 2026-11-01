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
