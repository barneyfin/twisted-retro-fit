# PlayScreen

Play on a computer: the street fills the window; the meter bottom left with the district above it; full-screen and pause tiles top right. Grunge City Rider adds its information where it happens (Barney, 30 October 2026): lives and the tip on the meter, the round and the zone's fares in the caption, the pin over where the taxi is heading, the power-ups on the taxi.

## When to use
- Throughout play. On a phone held sideways the layout is the same at the phone's scale (Meter shows both).

## Markup
```html
<canvas class="cn-world"></canvas>                  <!-- the street, WebGL -->
<canvas class="cn-marks"></canvas>                  <!-- the pin, the taxi's badges and rings, the SAFE! sign: CityNights.hud -->
<canvas class="cn-hud"></canvas>                    <!-- the meter, the caption and the receipt slip, redrawn when something changes -->
<div class="cn-ui cn-tiles" style="position:absolute;right:24px;top:24px">{IconTile: full screen, pause}</div>
```

## The game provides
- The fare, time and speed for the meter, and the taxi's district for the caption. Grunge City Rider also: lives, the tip, the round and fares done, where the pin stands and what it says, the power-ups carried, and the moments (a fare paid, the tip halved or lost, a shielded hit, a zone change).

## Rules
- No panels, chips or bars over the picture during play: the meter is the HUD. What else shows belongs to a place: the caption to the meter, the pin to the bay it stands over, the badges and rings to the taxi. The one message is the receipt slip (ReceiptSlip); the one interruption the zone-change title (ZoneTitle).
- **Nothing over the lane ahead**: anything the taxi will meet first appears 20–80 m up its own lane, just above the taxi's roof, so nothing is drawn there except the SAFE! sign's second.
- The full play screen, with everything at once on a computer and a phone, is on the screens canvas ("the full play screen").
- Tiles `space-6` from the edges on a computer, `edge-phone` plus the safe area on a phone; pause last, at the edge.
- The touch hint shows on phones until the first move.
