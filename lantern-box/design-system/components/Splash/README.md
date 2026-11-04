# Splash

The splashes of colour: one small, menacing thing at ground level per stretch of path, lit from within by witch-green.

## When to use
- Placed along the path by the game, a few per screen at most. One design per place: Night, a pierced tin grave lantern; Blood Red Rain, a grotesque on a post; Dawn, an iron fire basket; Mist, a horned mask nailed to a stump.
- They are scenery with menace, not monsters: they do not attack unless a game's gameplay says they do.

## Code
```js
W.splash(ctx, "night", X, Y /* the ground under it, + 3 */, t, rm, seed);
```

## The game provides
- Where each stands, the time and Reduce motion.

## Rules
- `ink` cut-outs whose slits, eyes and grins are lit `witch-core` (`witch-intense` at the approved intense glow), with a `witch-glow` halo and a pool of light on the ground.
- A slow, small flicker (about 0.4 a second); steady under Reduce motion.
- Witch-green is for these only. The amber and blue versions on the directions page's early rounds are not used.
