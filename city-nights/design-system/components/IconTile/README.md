# IconTile

A square icon button made as a tiny sign: a lightbox tile in play, a neon tile on the title screen.

## When to use
- In play, top right: full screen, then pause at the edge.
- On the title screen, top right, neon: sound, then full screen. A back-to-arcade tile goes top left when the game was opened from the arcade.

## Markup
```html
<div class="cn-ui cn-tiles">
  <button class="cn-tile" aria-label="Full screen" aria-pressed="false"><span>{full-screen icon}</span></button>
  <button class="cn-tile" aria-label="Pause"><span>{pause icon}</span></button>
</div>
<button class="cn-ui cn-tile is-neon" aria-label="Sound on" aria-pressed="true"><span>{speaker icon}</span></button>
```
Add `is-phone` on phones (44px).

## The game provides
- Nothing: the shell places the tiles and handles them. Full screen is left out where the browser cannot go full screen or the game already fills the screen.

## Rules
- Lightbox tile: 48px (`tap-min` 44px on phones), a 3px `case` rim at `radius-tile`, the lit face inside at 7px, the icon in `ink-red`, `shadow-tile`.
- Neon tile: `neon-board`, a 1.5px `tube-teal` tube 4px inside, the icon in `tube-teal` with its glow.
- `space-2` apart, `space-6` from the screen's edges on a computer, `edge-phone` plus the safe area on a phone.
- Every tile has an `aria-label`; toggles carry `aria-pressed`.
