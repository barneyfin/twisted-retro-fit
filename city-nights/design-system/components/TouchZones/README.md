# TouchZones

Where touches count on a phone held sideways: two zones, either side of the taxi, from the top of the meter down. The player rests their thumbs wherever they like inside them. What a touch does there is the game's choice; in Grunge City Rider the side it lands on decides.

## When to use
- Grunge City Rider on touch devices (Barney, 30 October 2026, after the full play screen's thumb check; the side rule 31 October 2026, from play-testing).

## How it is worked out
```js
var zones = CityNights.hud.touchZones(viewW, viewH, meterTop, taxiLeft, taxiRight);   // two rectangles in CSS pixels
```
- `meterTop`: the top of the meter's case. `taxiLeft`, `taxiRight`: the taxi's sides on screen at its rear bumper, its widest.

## The game provides
- What a touch does in each zone. Grunge City Rider's, below; another game may choose differently (for example, either thumb doing anything in either zone, as Grunge City Rider first did).

## Rules
- **Two zones**: left, from the left edge to the taxi; right, from the taxi to the right edge; each from the top of the meter's case to the bottom of the screen (inside the safe area).
- **Grunge City Rider: the side decides** (Barney, 31 October 2026, from play-testing: thumbs skid on his Pixel). What a thumb does depends on the side of the taxi it lands on, and stays fixed until it lifts, wherever it skids meanwhile:
  - **Left of the taxi: drag to steer.** Held still, it does nothing.
  - **Right of the taxi: hold to brake**, after 0.18 s. It brakes on its own, and it never steers.
  - **A quick tap on either side: the horn.** Braking waits 0.18 s so that a tap doesn't also brake.
- The zones' shape and place are the same whatever a game chooses.
- A touch that starts in a zone keeps counting wherever it moves. A touch that starts anywhere else does nothing to the taxi, so the tiles (top right) and the upper picture are safe.
- **The meter** is inside the left zone: a thumb may rest there if the player likes, and there it can only cover the speed row. Moved in, just right of the meter, it covers only road beside the taxi.
- Nothing marks the zones in play; the touch hint shows how to drive until the first move (TouchHint).
