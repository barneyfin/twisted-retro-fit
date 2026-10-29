# Animal

Animals that wander into the road at night: a wild boar, a stray dog, a street cat and market chickens out of their crate. Dark shapes lit warm by the shops behind them, with the taxi's headlights caught in their eyes. They always get away.

## When to use
- Placed in the road by the game for the taxi to avoid (Barney, 29 October 2026: all four).
- **They always escape unhurt** (Barney, 29 October 2026): as the taxi reaches one it bolts for the kerb. No crash pop, ever. What a near miss costs the player is gameplay (PRD question 4).

## How it is drawn
Canvas 2D, by `CityNights.street`, drawn once into a picture and stood in the street like the people:

```js
var S = CityNights.street;
var boar = S.boar(false), boarRun = S.boar(true);   // also dog(run), cat(run), chicken(run, face), crate()
S.shadow(g, pt, d, x, 1.5, 0.6, 0.45);             // a soft contact shadow under it
S.stand(g, pt, boar, d, x);                         // feet at d metres ahead, x across (see Obstacle for pt)
```
Each picture carries its own scale (`ppm`, pixels per metre) and the point it stands on (`ax`, `ay`), so `stand` puts it at true size.

## The game provides
- Which animal, where it steps into the road, when it bolts and which way.

## Rules
- **Side-on, crossing, head turned to the taxi.** Two pictures each: standing, and the bolting stride.
- **Wild boar**, 1.4 m long, 0.9 m high: a heavy dark body, a bristly ridge, a long snout and small tusks (`chicken-light`). Eyeshine `eyeshine-amber`.
- **Stray dog**, about 1 m long: a Hong Kong village dog, pricked ears, long muzzle, tail curled over its back. Eyeshine `eyeshine-gold`.
- **Street cat**, 0.5 m: low and slim, round head, tail held up. Big `eyeshine-green` eyes: small animal, so its eyes show first.
- **Market chickens**, 0.4 m, in threes by a tipped bamboo crate (`crate-dark`, `crate-cane`): pale (`chicken-light` to `chicken-shade`) so the lamps pick them out, `face-red` combs, `chicken-beak` beaks and legs.
- Colours: bodies `animal-dark`, lifted from the feet up by the taxi's lamps in `animal-lit`; a warm rim along the top in `figure-rim`.
- **Eyeshine is steady**, never flashing. It is what the player sees first, from far up the road.
- **True size** (Barney, 29 October 2026). Grain at the traffic's level (`grain-vehicles`); the eyes are lights (`grain-signs`, none).
- Kept kind: the animals are never hit, hurt or shown in distress, because players include teens.
