# Meter

The taxi meter: a lightbox sign headed 的士 TAXI METER, bottom left of the picture, with fare, time and speed in red digits. It is the game's HUD. Grunge City Rider's meter also carries its lives and the tip (Barney, 30 October 2026).

## When to use
- Throughout play, on computers and phones. Dimmed with the rest of the picture under a dialog.

## Markup
The game draws it on its own small canvas over the picture, redrawn only when a number changes. As HTML (previews, mock-ups):
```html
<div class="cn-meter" style="--k:1.1">
  <div class="cn-meter-face">
    <div class="cn-meter-head"><span class="zh">的士</span><span class="en">TAXI METER</span></div>
    <div class="cn-meter-dial">
      <div class="cn-meter-row is-fare"><div class="cn-meter-lab"><span class="zh">車資</span><span class="en">FARE  HK$</span></div><div data-cn-digits=" 23.40" data-h="44"></div></div>
      <div class="cn-meter-row"><div class="cn-meter-lab"><span class="zh">時間</span><span class="en">TIME</span></div><div data-cn-digits="45" data-h="30.8"></div></div>
      <div class="cn-meter-row"><div class="cn-meter-lab"><span class="zh">速度</span><span class="en">KM/H</span></div><div data-cn-digits=" 62" data-h="30.8"></div></div>
    </div>
  </div>
</div>
```
`--k` = the picture's scale × `meter-scale`: 1.1 for a 720-line window, 0.596 for a 390-line phone. On phones set `--lab` so an 11px label is at least `phone-label-min`: `--lab: max(var(--k), 0.909)`.

Grunge City Rider's meter, with lives and the tip (`has-lives`, a paired row):
```html
<div class="cn-meter has-lives" style="--k:1.1">
  <div class="cn-meter-face">
    <div class="cn-meter-head"><span class="lead"><span class="zh">的士</span><span class="en">TAXI METER</span></span><span class="cn-meter-lives">{three life icons}</span></div>
    <div class="cn-meter-dial">
      <div class="cn-meter-row is-fare"><div class="cn-meter-lab"><span class="zh">車資</span><span class="en">FARE  HK$</span></div><div data-cn-digits="366.40" data-h="44"></div></div>
      <div class="cn-meter-row is-pair">
        <div class="cn-meter-cell"><div class="cn-meter-lab"><span class="zh">小費</span><span class="en">TIP</span></div><div data-cn-digits="0.32" data-h="24"></div></div>
        <div class="cn-meter-cell is-end"><div class="cn-meter-lab"><span class="zh">時間</span><span class="en">TIME</span></div><div data-cn-digits="38" data-h="24"></div></div>
      </div>
      <div class="cn-meter-row"><div class="cn-meter-lab"><span class="zh">速度</span><span class="en">KM/H</span></div><div data-cn-digits=" 84" data-h="30.8"></div></div>
    </div>
  </div>
</div>
```
On the game's canvas the life icons are `CityNights.hud.lives(g, x, y, 15.5, livesLeft)` in the meter's units (the preview draws them as the same shapes in SVG).

## The game provides
- The fare (six places, two decimals, so up to 999.99), the time (two places) and the speed in km/h (three places), each as a number. What the time means is the game's.
- Grunge City Rider also gives lives left (0 to 3) and the tip: a number while a passenger is aboard, nothing with no passenger (the row unlit, `' ,  '`), or "lost" once the tip is gone (dashes, `'-.--'`, for the rest of that ride).
- Its own row labels only if it changes what the meter counts; every label goes on the word list first.

## Rules
- Geometry, in pixels of the 540-line picture before the 82.5% scale: face 228 × 242 at 7px corners in a 4px `case` rim with a `lightbox-glow` of 20; heading band 34 deep plus the 9px rim; dark dial 210 × 190 inset 9, `meter-face`; rows 80, 50 and 50 deep with `meter-rule` hairlines 14 in from each side; digits 40 (fare) and 28 high, 18 from the right; labels 18 from the left.
- Heading in `meter-title-zh` and `meter-title-en`, `ink-red`. Labels `meter-label-zh` and `meter-label-en` in `meter-label`.
- Placed 14 picture pixels (`meter-inset`) from the left and bottom, scaled towards that corner. The district caption sits above it (DistrictCaption).
- **Grunge City Rider's meter** (Barney, 30 October 2026; HUD round 1, C): the face is 244 wide (dial 226), the rest as above. The heading has 的士 and TAXI METER together on the left, 8 apart, and **lives** on the right, 13 in from the face's edge: three small taxis seen from behind, each 15.5 high and 20 wide, 3.4 apart, in `taxi-red` with a `case` edge, a `shutter` rear window, a `face-cream` roof sign, `cone-orange` tail lights and a `face-yellow` plate; a lost life stays as a faint `life-lost` shape. The middle row is shared: **小費 TIP** on the left and **時間 TIME** on the right, each its label over its digits (21.8 high, label 5.5 above them), TIME right-aligned. 速度 KM/H keeps its row.
- **The tip row**: unlit with no passenger aboard (every segment, the point included, unlit); counting up during a ride (10% of the trip's fare so far, halved by each incident: a crash, or an animal hit or near miss); cleared at the drop-off, when the receipt slip shows what was paid; dashes for the rest of a ride once the tip is lost. In code a comma is an unlit point: `' ,  '`.
- Phones: the same place and size; only the labels grow to `phone-label-min`. The life icons keep their size. Touch controls never need a thumb on it (TouchZones).
- The fare holds at HK$999.99 (six places): enough for Grunge City Rider, whose runs should end at about HK$400–600 (decided with the gameplay, 29 October 2026). A seventh place is for a game whose rules need it.
