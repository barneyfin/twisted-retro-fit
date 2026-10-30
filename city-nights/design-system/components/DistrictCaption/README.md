# DistrictCaption

The district the taxi is in, Chinese over English like a film subtitle, just above the meter. In Grunge City Rider a third line gives the round and the zone's fares (Barney, 30 October 2026).

## When to use
- During play, whenever the taxi enters a district; it fades in over 0.6 s and stays.

## Markup
Drawn by the game on the meter's canvas: `CityNights.hud.caption(g, x, meterTop, k, m, { zh, en, round, fares, a })` draws the lines; leave out `round` for a game without rounds and it draws the first two only. As HTML:
```html
<div class="cn-caption" aria-hidden="true"><span class="zh">油麻地</span><span class="en">Yau Ma Tei</span>
  <span class="round"><span class="lbl"><span class="zh">輪</span>ROUND 2</span><span class="cn-lamps"><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i></i><i></i></span></span></div>
```
Add `is-phone` at a phone's scale. Announce the district to screen readers in the meter's hidden text.

## The game provides
- Nothing for the district: the kit knows the districts (尖沙咀 Tsim Sha Tsui, 佐敦 Jordan, 油麻地 Yau Ma Tei, 旺角 Mong Kok) and where each begins, each `district-length` long.
- Grunge City Rider gives the round and the fares done in this zone (0 to 5).

## Rules
- `caption-zh` over `caption-en` in `caption`, each with a 5px `caption-outline` (picture pixels), so it reads over any part of the street.
- Left edge 2 picture pixels right of the meter's. It keeps its size when the meter is scaled. With no round line, the English baseline is 14 picture pixels above the meter's top.
- **The round line** (Grunge City Rider): 輪 (`caption-round-zh`, 18px on a 720-line window) then ROUND n (`caption-round-en`, 17px, 1px spacing), both no smaller than 11 CSS px on phones and outlined like the caption (4px on a 720-line window); then, 10px on, five fare lamps 13px across (8 CSS px at least), 0.4 of a lamp apart, on a pill of black at 55%: a lamp lit `face-yellow` with its glow for each fare done in this zone, the rest `lamp-unlit` ringed `lamp-unlit-ring`. The line's middle sits 13.7px plus half its height above the meter's case; the English baseline 10px above the line, the Chinese 32px above that (as without the line).
- While the receipt slip shows, the caption steps aside (fades out and back).
- No box behind the words: the outline does that job.
