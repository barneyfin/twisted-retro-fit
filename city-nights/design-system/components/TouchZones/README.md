# TouchZones

Where touches count on a phone held sideways: two zones, either side of the taxi, from the top of the meter down. The player rests their thumbs wherever they like inside them.

## When to use
- Grunge City Rider on touch devices (Barney, 30 October 2026, after the full play screen's thumb check).

## How it is worked out
```js
var zones = CityNights.hud.touchZones(viewW, viewH, meterTop, taxiLeft, taxiRight);   // two rectangles in CSS pixels
```
- `meterTop`: the top of the meter's case. `taxiLeft`, `taxiRight`: the taxi's sides on screen at its rear bumper, its widest.

## The game provides
- What each gesture does: in Grunge City Rider, drag to steer, hold to brake, a quick tap for the horn (its gameplay note).

## Rules
- **Two zones**: left, from the left edge to the taxi; right, from the taxi to the right edge; each from the top of the meter's case to the bottom of the screen (inside the safe area).
- **Either thumb, in either zone**, does any gesture; the zones only say where touches count.
- A touch that starts in a zone keeps counting wherever it moves. A touch that starts anywhere else does nothing to the taxi, so the tiles (top right) and the upper picture are safe.
- **The meter** is inside the left zone: a thumb may rest there if the player likes, and there it can only cover the speed row. Moved in, just right of the meter, it covers only road beside the taxi.
- Nothing marks the zones in play; the touch hint shows how to drive until the first move (TouchHint).
