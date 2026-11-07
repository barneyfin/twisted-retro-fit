# ArchTile

The title screen's small tiles, High scores, sound and full screen: round-topped pieces of the same lit black card as the arch.

## When to use
- Top right of the title screen only. In play, the HUD's square tiles do this (HudTile).

## Markup
```html
<div class="lb-arch-tiles">
  <button class="lb-arch-tile" type="button" aria-label="High scores">{high scores icon}</button>
  <button class="lb-arch-tile" type="button" aria-label="Sound on" aria-pressed="true">{sound icon}</button>
  <button class="lb-arch-tile" type="button" aria-label="Full screen">{full-screen icon}</button>
</div>
```

## The game provides
- Nothing: the kit wires High scores, sound and full screen.

## Rules
- 44px, `ink`, top corners `radius-arch-tile` (22px), feet 4px, ringed and lit by `shadow-arch-tile`, `space-4` (12px) apart, 22px from the right and 20px from the top (18 and 14 on a phone).
- Icons are 22px strokes in `title-letter`. Sound off shows the speaker crossed out and the label "Sound off".
- Inside the Claude app, where full screen is refused, the full-screen tile makes the game fill its frame instead.
- Focus: a 2px `focus` outline 3px outside.

## Version 13
- **High scores is a tile**, first in the row (left of sound), because the arch has no room for a fifth item (Claude Code measured it: the computer's hint would end at 544 against the arch's foot at 514). It opens HighScores, whose Back returns to the title with the tile focused. With the keyboard, the tiles are reached with Tab, as before; the arch's arrows don't reach them.
- **Its icon is the crowned headstone** (Barney, 7 November 2026): a headstone with two engraved lines under a small crown, the best names "etched into history", in 2px strokes in the 24-unit box like sound and full screen. It belongs to the graveyard world and doesn't read as a sports podium. It replaces the kit's podium stand-in. The other two drawn, a laurel round a 1 and a ranked scroll, stay in the preview as the record of the choice.
