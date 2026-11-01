# TitleScreen

The title screen assembled: the first place running slowly behind a light scrim, the arch on the left, the arch tiles top right.

## When to use
- Every game's first screen, and where Quit to menu and Menu lead.

## Markup
```html
<div class="lb-ui" style="position:absolute;inset:0">
  <div class="lb-scrim is-title"></div>
  <div style="position:absolute;left:60px;top:26px">{TitleArch}</div>
  <div style="position:absolute;right:22px;top:20px">{ArchTile x2}</div>
</div>
```
On a phone held sideways: the arch `is-phone` at 44px left and 8px top; the tiles 18px from the right and 14px from the top; no hint.

## The game provides
- Its name (in the arch) and which place runs behind (the first, at walking pace, no monsters attacking).

## Rules
- The arch stands on the left, so the middle and right of the place stay open; nothing else covers the picture.
- The first key or tap also starts the audio.
- Keyboard hints are hidden on touch devices.
