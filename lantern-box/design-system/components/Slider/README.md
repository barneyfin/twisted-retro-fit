# Slider

The Volume row: a name, a brass slider and the value in per cent.

## When to use
- Volume in SettingsPanel. Not for choices with names (Segments) or on-or-off settings (Toggle).

## Markup
```html
<div class="lb-setting is-first" style="height:40px">
  <label class="lb-setting-name" for="vol" style="width:140px">Volume</label>
  <input class="lb-slider" id="vol" type="range" min="0" max="100" value="80">
  <span class="lb-value" style="width:44px">80%</span>
</div>
```

## The game provides
- Nothing. Volume is shared across the arcade and scales the master gain (0 mutes, soundtracks too).

## Rules
- The browser's own range input, coloured with `accent-color: brass`, so it works with keys, mouse and touch everywhere.
- Name 140px wide (70px on a phone), value 44px (38px), right-aligned in `text-2`.
- Focus: a 2px `focus` outline, 2px outside.
