# StopZone

The bay painted on the road where the player stops: to pick a passenger up, or to drop them off. One design in two colours: teal for pick-up, pink for drop-off.

## When to use
- **Pick-up**: beside a waiting passenger (Passenger). **Drop-off**: at the fare's destination, with no one waiting.
- One bay at a time. In Grunge City Rider holding the brake with at least three-quarters of the taxi inside counts; no full stop is needed (`GAMEPLAY-grunge-city-rider.md`).

## How it is drawn
Canvas 2D, by `CityNights.street`: the paint is made once into a picture, then laid on the road with its light:

```js
var S = CityNights.street;
var pickup = S.bay('pickup'), dropoff = S.bay('dropoff');   // made once and kept
S.drawBay(g, pt, pickup, d0, d0 + 10, -4.85, -1.85);        // 10 m along, 3 m across the kerbside lane
```
`drawBay` lays the bay's light on the wet road, then the paint, then the paint's glow.

## The game provides
- Where the bay is, which kind, how much of the taxi is inside it, and when the stop has counted.

## Rules
- **Never in the clear stretch** (`clear-stretch`, 40 m) before a tunnel, nor inside one (Tunnel; Barney, 30 October 2026).
- **Option A, the painted bay** (Barney, 29 October 2026): a faint wash of the colour over the bay, dashed sides, solid ends, and the words painted on the road, stretched along it as road lettering is, read from the approach.
- **Two colours** (Barney, 29 October 2026): pick-up `tube-teal` with `tube-core-teal` lettering 上客 PICK-UP; drop-off `tube-pink` with `tube-core-pink` lettering 落客 DROP-OFF. Teal and pink differ in lightness as well as hue, and the words differ, so colour is never the only clue.
- **Size**: `bay-size`, 3 m across and 10 m along, about twice the taxi's length: that is the stopping area.
- **Place**: the kerbside lane on the left, its kerb edge 0.15 m from the kerb.
- Lettering: Noto Sans TC Bold (`zh-sans`) and Antonio (`display`).
- Steady: the bay never flashes or pulses. Its light is a light (`grain-signs`, none); the paint takes the road's grain.
- **The bay's ring** (Barney, 30 October 2026: round 2, A, keeping only the inner ring): once three-quarters of the taxi is inside, the bay's colour gathers in a ring of light on the road round the taxi, close to it; it fades in over `ring-fade` and fades out once the stop has counted. No second, spreading ring. While it shows, 保's ring steps aside (TaxiMarks). Drawn on the road before the taxi, so the taxi hides what is under it:
  ```js
  CityNights.hud.bayRing(g, pt, laneX, 'tube-teal', a);   // laneX: the taxi's lane centre in metres; 'tube-pink' for a drop-off; a: 0 to 1
  ```
  An ellipse 3.4 m along by 1.45 m across round the taxi's middle (2.3 m ahead of its rear bumper), stroked 16 and 5 picture pixels wide with soft blurs and a fine white line, over a faint fill. It is the bay's light, so it takes no grain.
- **Why a ring**: once the taxi is in a bay, the taxi hides almost all of it; only the paint beside the rear wheels shows. On the way in, the pin (TargetPin) marks the bay from far off.
- **The passenger getting in**: see Passenger.
- Chinese: 上客 and 落客 are on the word list for the Cantonese reader.
