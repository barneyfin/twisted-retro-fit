# MenuPanel

The list of choices inside a lightbox: one selected item lit as the red band, icons on the left, the confirm keycap on the selected row.

## When to use
- The action list in PauseOverlay, and a mode choice if a game has modes (each item then carries a one-line `cn-note` under its label).
- Not on the title screen: that menu is neon (TitleMenu). Not for a two-button choice: use `cn-btn` buttons (GameOverCard).

## Markup
```html
<div class="cn-menu" role="menu" aria-label="Paused">
  <button class="cn-item is-selected" aria-current="true">{play icon}Resume<span class="cn-kbd">Esc</span></button>
  <button class="cn-item">{restart icon}Restart</button>
  <button class="cn-item">{sliders icon}Settings</button>
  <button class="cn-item">{quit icon}Quit to menu</button>
</div>
```

## The game provides
- Labels (sentence case, verbs or nouns, never ALL CAPS in source) and one 24-viewBox stroke icon per item.
- Which item is selected. Arrow keys move the selection, Enter or a tap confirms, Esc goes back. Selection moves instantly.

## Rules
- Items `item-height` tall, `menu` type in `panel-ink`, icons 22px, `space-3` from the label, `space-1` between items.
- Selected: `band-red` with `on-band` text and `shadow-band`; the keycap appears on that row only, drawn in `on-band`.
- Hover: `segment-ground`. Disabled: 45% opacity.
- Three to five items.
