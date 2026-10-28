# NameEntry

Three initials chosen letter by letter in lit slots, after a fare that makes the top ten: a lightbox headed 新紀錄 NEW BEST.

## When to use
- After GameOverCard's Continue, when the fare enters the top ten. Skipped when it does not.

## Markup
```html
<div class="cn-ui cn-lightbox" role="dialog" aria-labelledby="ne-title" style="width:400px">
  <div class="cn-face is-centred">
    <h2 class="cn-header" id="ne-title"><span class="zh" lang="zh-Hant">新紀錄</span><span class="en">New best</span></h2>
    <p class="cn-body">Enter your initials</p>
    <div class="cn-slots" role="group" aria-label="Initials">
      <div class="cn-slot-col">{chevron up}<div class="cn-slot">B</div>{chevron down}</div>
      <div class="cn-slot-col is-selected" aria-current="true">{chevron up}<div class="cn-slot">A</div>{chevron down}</div>
      <div class="cn-slot-col">{chevron up}<div class="cn-slot is-empty">·</div>{chevron down}</div>
    </div>
    {Keycap hints: ↑ ↓ Letter · ← → Move · Enter Save}
  </div>
</div>
```

## The game provides
- Nothing: the kit handles the letters and saves the row.

## Rules
- Letters are A–Z, 0–9 and a dot. Up and down change the letter, left and right move, Enter saves. On touch, tapping a slot selects it and opens the phone's keyboard (a hidden one-character input).
- Slots 72 by 92px on `meter-face`, letters in `slot` type, `digit-on` with `digit-glow`. The selected slot has a 2px `digit-on` edge and glow and `ink-red` chevrons above and below; an empty slot shows a `meter-dim` dot.
- The last initials entered are filled in. High scores stay on the device, top ten per game, in the arcade's shared format.
