# Meter

The taxi meter: a lightbox sign headed 的士 TAXI METER, bottom left of the picture, with fare, time and speed in red digits. It is the game's HUD.

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

## The game provides
- The fare (six places, two decimals, so up to 999.99), the time (two places) and the speed in km/h (three places), each as a number. What the time means is the game's.
- Its own row labels only if it changes what the meter counts; every label goes on the word list first.

## Rules
- Geometry, in pixels of the 540-line picture before the 82.5% scale: face 228 × 242 at 7px corners in a 4px `case` rim with a `lightbox-glow` of 20; heading band 34 deep plus the 9px rim; dark dial 210 × 190 inset 9, `meter-face`; rows 80, 50 and 50 deep with `meter-rule` hairlines 14 in from each side; digits 40 (fare) and 28 high, 18 from the right; labels 18 from the left.
- Heading in `meter-title-zh` and `meter-title-en`, `ink-red`. Labels `meter-label-zh` and `meter-label-en` in `meter-label`.
- Placed 14 picture pixels (`meter-inset`) from the left and bottom, scaled towards that corner. The district caption sits above it (DistrictCaption).
- Phones: the same place and size; only the labels grow to `phone-label-min`. Touch controls must never need a thumb parked on it.
- A fare over 999.99 needs a seventh place: decide that with the game's rules before widening the meter.
