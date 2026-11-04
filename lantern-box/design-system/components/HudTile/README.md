# HudTile

The HUD's square tiles, pause and full screen: a small brass plaque with an icon.

## When to use
- Top right in play, left of the wisps counter: full screen (computers only), then pause.
- Not on the title screen (ArchTile).

## Markup
```html
<button class="lb-ui lb-tile" type="button" aria-label="Pause"><span>{pause icon}</span></button>
```
Add `is-phone` for 44px.

## The game provides
- Nothing: the kit wires pause and full screen.

## Rules
- 40px on a computer, `target` (44px) on a phone: a 1.5px `brass` edge round a `tile-face`, corners cut by `chamfer-control`. Icons are 20px strokes in `heading`.
- Tiles sit `space-3` apart (`space-2` on a phone), top-aligned with the counter.
- Focus: a 2px `focus` ring inside the face.

## Version 8
- A third tile, "?" (How to play), sits between full screen and pause; it opens the how-to-play page with the game paused (HowToPlay).
