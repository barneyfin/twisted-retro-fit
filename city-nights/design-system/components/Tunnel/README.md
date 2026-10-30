# Tunnel

夜光隧道 Nightglow Tunnel: a road tunnel under a tower block at every district line. The taxi drives in at the end of one district and out at the start of the next. In Competitive it also hides a loop: a zone that reaches the end of its district comes out at the start of the same district, the zone carrying on unchanged.

## When to use
- At every district line, in every mode (Barney, 30 October 2026: a tunnel, at every district line; look B, under a tower).
- Competitive: a zone that reaches the end of its district (rare) drives through and comes out at the start of the same district. After a zone change a zone starts just inside the next tunnel's exit, so the player drives out into the new district.
- Practice: drives through four tunnels a lap; its music switch (into Yau Ma Tei, and back into Tsim Sha Tsui) falls inside one.

## How it is drawn
- **The portal's face**: one picture, drawn once by `CityNights.street.tunnelFace(ppm)` (Canvas 2D, colours by token name): the block's face as the road meets it, `tunnel-face-size` (13.5 m from building line to building line, 36 m high), with the mouth left clear. The kit stands it at the portal, square to the road, like a sign; `ax`, `ay` is the middle of the mouth's foot. On it: the name on a lightbox over the mouth (夜光隧道 NIGHTGLOW TUNNEL), the steady green lane signals, the podium's fascia, and above it the block's windows and five of the street's own signs (好味麵家, 好運茶餐廳, 健康藥房, 時裝, 金滿金行).

```js
var face = CityNights.street.tunnelFace(48);   // 48 pixels per metre; face.metres is [13.5, 36]
```
- **The inside** is the kit's own geometry, in the street's perspective: `tunnel-size` (12 m wall to wall, 4.8 m road to ceiling): the road's 10 m with a 1 m walkway each side. Tiled lower walls 2.2 m high (`tunnel-tile` at the foot to `tunnel-tile-top`, tile joints every 0.6 m up and 1.2 m along, a little grime panel to panel), upper walls (`tunnel-wall` to `tunnel-wall-top`, lighter toward the light), the ceiling (`tunnel-ceiling`), the road (`tunnel-road`) with its lane and edge markings carried through (`tunnel-line`), and the walkways (`tunnel-walk`).
- **The light**: two continuous strips, one along each upper wall 0.45 m under the ceiling (`tunnel-strip`), with their glow (`tunnel-glow`) and a soft smear on the wet road. They are lights: no grain.
- **The far end** fades into `tunnel-haze` by about 80 m, so no exit is in view while the taxi is deep inside.
- **Coming out**: the exit's mouth frames the next district's street; its light spills warm onto the last 16 m of walls, ceiling and road.

## The game provides
- Nothing for the tunnels themselves: the kit puts one at every district line, `tunnel-length` long (180 m, a starting figure), the line in its middle.
- When a zone reaches the end of its district (Competitive): the loop. When a zone change puts the taxi just inside the next tunnel's exit.

## Rules
- **All four tunnels are the same**, inside and at the exit, so a loop is invisible: the jump happens deep inside, where nothing outside the tunnel is in view, and everything in view (walls, strips, traffic) looks the same before and after it. The traffic near the taxi is carried across the jump.
- **The jump** happens at the district line, the tunnel's middle: 90 m of tunnel ahead, more than the drawn road. For about a quarter of a second (about 5 m at 70 km/h) the picture is all tunnel while the kit makes new street.
- **Brightness**: inside is about half the street's (Barney, 30 October 2026: B's inside), never below the zone change's dim (`zone-shade`). It changes as each mouth fills the view, over about a second; nothing switches at once, and the whole screen never flashes.
- **No lamps**: continuous strips only. Lamps 4 m apart would pass over the taxi about five times a second, over the 3-a-second limit.
- **Lane signals**: a steady green arrow over each lane at the mouth (`signal-green`, `signal-glow`), never flashing.
- **The clear stretch** (`clear-stretch`, 40 m) before each tunnel: no hanging signs, and no bay, power-up, obstacle, animal or passenger, so the portal and its name read for about 2 s (Barney, 30 October 2026). Nothing of these inside the tunnel either; traffic drives through, keeping its lane. No people inside.
- **The pin shows inside** (Barney, 30 October 2026): when the passenger's drop-off is further on, it stands over the far end of the drawn road in the bay's lane, as on the street.
- **The caption** changes at the district line, mid-tunnel, as it does at any line (DistrictCaption). On a loop it does not change: the district is the same.
- Grain: the portal's face, the walls and the ceiling at the buildings' level (`grain-white`), the road inside as the street's road is (`grain-cab` round the taxi, `grain-white` beyond); the strips, the signs and the lane signals none (`grain-signs`).
- Chinese: 夜光隧道 and the five sign names are on the word list.
