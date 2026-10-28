# DistrictCaption

The district the taxi is in, Chinese over English like a film subtitle, just above the meter.

## When to use
- During play, whenever the taxi enters a district; it fades in over 0.6 s and stays.

## Markup
Drawn by the game on the meter's canvas. As HTML:
```html
<div class="cn-caption" aria-hidden="true"><span class="zh">油麻地</span><span class="en">Yau Ma Tei</span></div>
```
Add `is-phone` at a phone's scale. Announce the district to screen readers in the meter's hidden text.

## The game provides
- Nothing: the kit knows the districts (尖沙咀 Tsim Sha Tsui, 佐敦 Jordan, 油麻地 Yau Ma Tei, 旺角 Mong Kok) and where each begins.

## Rules
- `caption-zh` over `caption-en` in `caption`, each with a 5px `caption-outline` (picture pixels), so it reads over any part of the street.
- Left edge 2 picture pixels right of the meter's; the English baseline 14 picture pixels above the meter's top. It keeps its size when the meter is scaled.
- No box behind it: the outline does that job.
