# Keycap

A small key label in a keyboard hint, always followed by what it does.

## When to use
- Under the title menu (on the arch), under the pause menu, in settings beside Done, under the initials.
- Computers only. Phones show no keyboard hints; touch controls are designed with each game's play screen.

## Markup
```html
<p class="lb-hint">{up keycap} {down keycap} letter · {left keycap} {right keycap} move · <span class="lb-kbd">Enter</span> done</p>
<!-- an arrow keycap: the arrow is drawn, not typed -->
<span class="lb-kbd" aria-label="Up arrow"><svg viewBox="0 0 10 10"><path d="M5 8.5 V1.5 M2 4.5 L5 1.5 L8 4.5"/></svg></span>
```
Down: `M5 1.5 V8.5 M2 5.5 L5 8.5 L8 5.5`. Left: `M8.5 5 H1.5 M4.5 2 L1.5 5 L4.5 8`. Right: `M1.5 5 H8.5 M5.5 2 L8.5 5 L5.5 8`.

## The game provides
- The keys it binds, as printed on a keyboard (Enter, Esc, Space, letters, arrows), and the action word for each, lower case after the key.

## Rules
- `hint` type in `text-3`; keycaps 20px tall with a 1px `brass-dim` border, `radius-key` corners and `text` letters. On the arch: `title-hint`, `title-key-line` and `title-key`, 13px.
- Arrows are drawn as 10px strokes, because the kit's Alegreya Sans has ↑ and ↓ but not ← and →; drawn, all four match.
- Groups are separated by a middle dot. Never a keycap without its action.
