# Passenger

Someone at the kerb hailing the taxi. The one person in the street drawn sharp and in colour, standing in a warm pool of light, so the eye finds them among the ghosted crowd.

## When to use
- When the game has a fare waiting: one passenger at a time, on the kerbside pavement beside a pick-up bay (StopZone).
- Picking up and dropping off passengers is how Grunge City Rider is played (Barney, 29 October 2026); the rules for it are gameplay (PRD question 4).

## How it is drawn
Canvas 2D, by `CityNights.street`, drawn once into a picture and stood on the pavement:

```js
var S = CityNights.street;
var p = S.passenger('case', 0);                              // kind: 'plain' | 'case' | 'bags'; pose 0 hailing, 1 waving
S.decal(g, pt, S.pool(), d - 1.4, d + 1.4, x - 1.4, x + 1.4, 1, 'lighter');   // the pool of light, 2.8 m across, first
S.shadow(g, pt, d - 0.1, x, 0.6, 0.3, 0.4);
S.stand(g, pt, p, d, x);
```

## The game provides
- Where the passenger waits (the bay's place), which kind, and when they get in.

## Rules
- **Option A** (Barney, 29 October 2026): every passenger stands in the warm pool of light (`sodium`), the suitcase passenger included.
- **Three kinds** (all approved): plain, in a `coat-red` coat; with a `suitcase-blue` suitcase, in `coat-blue`; with shopping (`bag-paper` and `face-red` bags), in `coat-olive`. Faces and hands `skin`, hair and shoes `hair-dark`, trousers `trouser-dark`.
- **The one person in colour.** Everyone else in the street is a ghosted silhouette; the passenger is drawn sharp, not ghosted, with the shops' warm light along their edges (`figure-rim`) and the street's light on the side facing the road.
- **Hailing**: the arm nearest the road raised. A waiting passenger swaps between the two poses every `wave-time` (0.4 s) until the taxi stops. Under Reduce motion they hold the hailing pose.
- **Place**: on the kerbside pavement on the left (Hong Kong drives on the left), level with the middle of the bay, about 0.6 m in from the kerb.
- **True size**: 1.7 m tall. Grain at the traffic's level (`grain-vehicles`), not the people's, so they stay sharp.
