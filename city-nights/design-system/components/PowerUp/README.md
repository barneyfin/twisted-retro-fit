# PowerUp

A power-up is a small lightbox sign hovering over the road on its own pool of light, lettered with one Chinese character: the street's wall of signs, shrunk to something the taxi drives through.

## When to use
- Placed on the road by the game, in a lane, for the taxi to drive through and collect.
- Five kinds, one theme (Barney, 28 October 2026: option A, sign tokens). Their names and effects were settled with Grunge City Rider's gameplay (29 October 2026; `GAMEPLAY-grunge-city-rider.md`).

## Markup
The game draws the token once with the 2D canvas into its texture, like the street's signs, and places it on the road like a car. As HTML (previews, mock-ups):
```html
<div class="cn-powerup is-time is-bobbing" style="--s:104px">
  <div class="cn-token"><span class="face"><span class="zh">時</span></span></div>
  <span class="pool"></span>
</div>
```
`--s` is the token's size; `.is-time`, `.is-fare`, `.is-speed`, `.is-shield`, `.is-double` set its face and ink.

## The game provides
- Which kind, where on the road (lane and distance), and what happens when the taxi collects it. In Grunge City Rider one comes every 20–40 s of driving; 雙 is 1 in 12 and the other four share the rest.

## Rules
- **The five**, each a sign face with its ink:

| Name | Character | Face | Ink | What it does (Grunge City Rider) |
| --- | --- | --- | --- | --- |
| More time | 時 time | `face-green` | `ink-cream` | +20 s on the clock (99 at most), at once |
| Fare bonus | 錢 money | `face-yellow` | `ink-black` | +20% of the trip's fare at the drop-off |
| Speed boost | 快 fast | `face-red` | `ink-yellow` | 20% faster, 84 km/h, for 10 s; another restarts the 10 s |
| Shield | 保 protect | `face-blue` | `ink-white` | One free crash (vehicles, roadworks, animals): no crash pop, no freeze, no life or tip lost; one held at a time |
| Double fare | 雙 double | `face-cream` | `ink-red` | +100% of the trip's fare at the drop-off; rare |

快, 保 and one fare boost can be on together. The fare boosts don't stack: the newest replaces the older, and one picked up with no passenger aboard is wasted.

- **Shape**: a square lightbox, `case` rim 3.7% of its size, corners 8.8%, face with the signs' light band and 1px light line, the character in `sign-zh` at 59% of the size. A glow of its own face colour round it, and a pool of the same colour on the wet road beneath it. No grain (`grain-signs`).
- **Size and place**: about 1.3 lane-markings tall at its distance, hovering a third of its height above the road; scaled with distance like the cars.
- **Telling them apart**: by colour first, then the character close up. Yellow and cream are light faces and blue, red and green dark ones, but green (時) and red (快) are almost the same lightness, so a red-green colour-blind player may mix those two up at a distance; the character and the meter's change tell them apart. Barney kept the colours as they are (28 October 2026); `face-teal` for 時 is the fix if players find it a problem.
- **Motion**: a slow bob, 1.6 s each way, a few pixels. No flashing or pulsing; with **Reduce motion** it holds still.
- **Collecting**: the token goes, and the effect shows where it happens: 時 on the meter's clock; 快, 保 and the fare boost as badges under the taxi (TaxiMarks), 快 with its ring of time left and 保 with its ring of light on the road; the fare boost's money on the receipt slip at the drop-off. The game's own pick-up sound plays. A crash pop never plays for a pick-up.
- **A shielded hit** shows the SAFE! sign (ShieldSign), and 保's badge and ring go.
- The five characters are on the word list for the Cantonese reader.
