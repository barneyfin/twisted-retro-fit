# Keycap

A small key label naming a keyboard control, always followed by the action it does; on the street the hints sit on a dark plaque.

## When to use
- The title screen's control hints, bottom left, on a plaque: ← → Steer, ↓ Brake, Esc Pause (the game's own keys).
- On a selected menu item and a primary button (Enter, Esc), and in dialogs for their keys (↑ ↓ Letter, ← → Move, Enter Save).
- Hidden on touch devices; phones get TouchHint.

## Markup
```html
<div class="cn-ui cn-plaque cn-keys">
  <span class="cn-kbd">←</span><span class="cn-kbd">→</span><span class="act">Steer</span>
  <span class="cn-kbd">↓</span><span class="act">Brake</span>
  <span class="cn-kbd">Esc</span><span class="act">Pause</span>
</div>
```
In a lightbox, drop `cn-plaque`: the keycaps take the face's colours.

## The game provides
- The keys it binds, named as printed on a keyboard (Enter, Esc, Space, Shift, ↑ ↓ ← →, capital letters), and the action word for each.

## Rules
- `kbd` type. On the lightbox face: `kbd-fill`, a 1px `kbd-line` edge (2px at the bottom), `panel-ink`. On the plaque: `kbd-dark-fill`, `kbd-dark-line`, `night-text`, actions in `meter-label`. On the red band: an `on-band` outline, no fill.
- Keycap first, action second, groups `space-4` apart. Three or four groups at most in a row.
- Never a keycap without its action word.
