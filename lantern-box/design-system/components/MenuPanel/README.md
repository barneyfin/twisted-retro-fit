# MenuPanel

A plaque's list of choices: the selected item is the brass band with a diamond, the others plain.

## When to use
- Pause (Resume, Restart, Settings, Quit to menu) and game over (Play again, High scores, Menu). A modes list, if a game has modes.
- Not on the title screen (TitleArch has its own lit menu). Not for two choices side by side (Button).

## Markup
```html
<nav class="lb-menu" aria-label="Pause menu">
  <button class="lb-item is-selected" type="button" aria-current="true">Resume</button>
  <button class="lb-item" type="button">Restart</button>
  <button class="lb-item" type="button">Settings</button>
  <button class="lb-item" type="button">Quit to menu</button>
</nav>
```

## The game provides
- Labels, sentence case. Which item is selected: arrow keys move it, Enter or a tap confirms, Backspace goes back (version 12: never Esc). It moves instantly.

## Rules
- Items `item-height` (46px) tall, `menu` type, `space-1` apart, labels 40px in from the left so they line up with the selected one's.
- Selected: `brass` with `on-brass` text, 700, a 16px diamond, corners cut by `chamfer-control`. Keyboard focus follows the selection, so the band is the focus mark.
- Hover: `heading`. Disabled: 45% opacity.
- On a phone: 44px tall, 18px, labels 35px in, a 14px diamond.
- Three to five items.
