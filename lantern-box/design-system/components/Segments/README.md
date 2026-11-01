# Segments

A choice of one from a few, as joined segments: the chosen one is brass. Lantern Box's Picture setting.

## When to use
- Picture (Automatic, Best, Faster, Fastest) in SettingsPanel. Up to four short labels.

## Markup
```html
<div class="lb-segments" role="group" aria-labelledby="pic-l">
  <button type="button" aria-pressed="true">Automatic</button>
  <button type="button" aria-pressed="false">Best</button>
  <button type="button" aria-pressed="false">Faster</button>
  <button type="button" aria-pressed="false">Fastest</button>
</div>
```
- `lb-segments is-grid` lays them two by two, each its own 44px button (the phone layout).

## The game provides
- Nothing for Picture. The kit applies it.

## Rules
- One row, a 1.5px `brass-dim` border round the group, `brass-deep` dividers (decorative), 40px tall, `segment` type. Chosen: `brass`, `on-brass`, 700.
- On a phone: two by two, `space-2` (6px) apart, each `target` tall with its own `brass-dim` border.
- Arrow keys move the choice within the group; it applies at once.
