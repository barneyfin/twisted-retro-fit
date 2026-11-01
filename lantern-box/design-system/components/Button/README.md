# Button

A plaque's buttons: the primary one is the brass band (with a diamond on Play again), the others are outlined in brass-dim.

## When to use
- Done (settings, initials), Play again and Menu (high scores), Continue (game over after a top-ten score).
- Not for a list of three or more choices: use MenuPanel.

## Markup
```html
<div class="lb-btns">
  <button class="lb-btn is-primary has-diamond" type="button">Play again</button>
  <button class="lb-btn" type="button">Menu</button>
</div>
```

## The game provides
- Labels: a verb or a plain noun, sentence case. One primary button per plaque.

## Rules
- `target` tall (44px). Primary: `brass` fill, `on-brass` label in `button` type (700), corners cut by `chamfer-control`. Secondary: a 1.5px `brass-dim` border, `text` label, 400; hover `heading`.
- `has-diamond` adds the 14px diamond before the label: only Play again carries it, matching the selected menu item.
- Side by side they share the width (`lb-btns`, `space-2` apart). On a phone the label is 17px.
- Focus: a 2px ring inside, `focus` on dark and `on-brass` on brass. The primary button is focused when its plaque opens.
