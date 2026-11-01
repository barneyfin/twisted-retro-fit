# ArchTile

The title screen's two small tiles, sound and full screen: round-topped pieces of the same lit black card as the arch.

## When to use
- Top right of the title screen only. In play, the HUD's square tiles do this (HudTile).

## Markup
```html
<div class="lb-arch-tiles">
  <button class="lb-arch-tile" type="button" aria-label="Sound on" aria-pressed="true">{sound icon}</button>
  <button class="lb-arch-tile" type="button" aria-label="Full screen">{full-screen icon}</button>
</div>
```

## The game provides
- Nothing: the kit wires sound and full screen.

## Rules
- 44px, `ink`, top corners `radius-arch-tile` (22px), feet 4px, ringed and lit by `shadow-arch-tile`, `space-4` (12px) apart, 22px from the right and 20px from the top (18 and 14 on a phone).
- Icons are 22px strokes in `title-letter`. Sound off shows the speaker crossed out and the label "Sound off".
- Inside the Claude app, where full screen is refused, the full-screen tile makes the game fill its frame instead.
- Focus: a 2px `focus` outline 3px outside.
