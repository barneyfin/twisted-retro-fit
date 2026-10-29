# StopZone

The bay painted on the road where the player stops: to pick a passenger up, or to drop them off. One design in two colours: teal for pick-up, pink for drop-off.

## When to use
- **Pick-up**: beside a waiting passenger (Passenger). **Drop-off**: at the fare's destination, with no one waiting.
- One bay at a time. How long the player must stop, and how "inside" is judged, are gameplay (PRD question 4).

## How it is drawn
Canvas 2D, by `CityNights.street`: the paint is made once into a picture, then laid on the road with its light:

```js
var S = CityNights.street;
var pickup = S.bay('pickup'), dropoff = S.bay('dropoff');   // made once and kept
S.drawBay(g, pt, pickup, d0, d0 + 10, -4.85, -1.85);        // 10 m along, 3 m across the kerbside lane
```
`drawBay` lays the bay's light on the wet road, then the paint, then the paint's glow.

## The game provides
- Where the bay is, which kind, and whether the taxi is stopped inside it.

## Rules
- **Option A, the painted bay** (Barney, 29 October 2026): a faint wash of the colour over the bay, dashed sides, solid ends, and the words painted on the road, stretched along it as road lettering is, read from the approach.
- **Two colours** (Barney, 29 October 2026): pick-up `tube-teal` with `tube-core-teal` lettering 上客 PICK-UP; drop-off `tube-pink` with `tube-core-pink` lettering 落客 DROP-OFF. Teal and pink differ in lightness as well as hue, and the words differ, so colour is never the only clue.
- **Size**: `bay-size`, 3 m across and 10 m along, about twice the taxi's length: that is the stopping area.
- **Place**: the kerbside lane on the left, its kerb edge 0.15 m from the kerb.
- Lettering: Noto Sans TC Bold (`zh-sans`) and Antonio (`display`).
- Steady: the bay never flashes or pulses. Its light is a light (`grain-signs`, none); the paint takes the road's grain.
- Not yet designed: how the bay shows that the taxi is stopped inside it, and the passenger getting in. Those come with the gameplay.
- Chinese: 上客 and 落客 are on the word list for the Cantonese reader.
