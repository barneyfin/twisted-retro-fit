# Lights

The glow points: every warm light in a place, in gold. The potion is the one glow point in its own red.

## When to use
- Wherever the scenery has a light: candles at graves, a lantern on a post, street lamps in the old town, bracket lanterns by doors, a candle in a wayside shrine, string lights from house to post, lit windows. The potion sits on a wall or the ground.

## Code
```js
const p = W.parts;
p.drawCandle(ctx, X, Y, t, rm);          p.drawWallLamp(ctx, X, Y, t, rm);
p.drawPost(ctx, X, Y, true, W.pal.GOLD_LIGHT);   p.drawStreetLamp(ctx, X, Y, W.pal.GOLD_LIGHT);
p.drawShrine(ctx, X, Y, t, rm);          p.drawPotion(ctx, X, Y, t, rm);
p.drawFairy(ctx, [ax, ay, qx, qy, bx, by, seed], t, level);   // string lights along a curve
p.fillHoles(ctx, sprite, X, Y, 1, rng, { litP, win: W.pal.GOLD_LIGHT, a: 0.95, bar: W.pal.INK, dark: "#1a1218", crack: true });   // a building's windows
```

## The game provides
- Where the lights go, the time and Reduce motion. Each place's share of lit windows is `W.places[level].litP` (Night 18%, rain 26%, Dawn 6%, Mist 10%; the house on the path 34%).

## Rules
- Glass and flames `lamp-glass`; halos `gold-light` fading out; string lights `string-light` (`string-light-storm` in the rain) with `string-glow`; unlit windows `window-dark`; lit ones `gold-light` with a cross of glazing bars, and a crack of gold under a door.
- Candles flicker gently (under 1 a second), string lights twinkle slowly, the potion pulses and sends up bubbles. All slow further under Reduce motion.
- Gold is never on a monster, and lights never flash.
