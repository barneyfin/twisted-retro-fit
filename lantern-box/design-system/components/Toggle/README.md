# Toggle

An On or Off setting, said in words: On is the brass band, Off is outlined.

## When to use
- Effects and Reduce motion in SettingsPanel, and any on-or-off row a game adds.

## Markup
```html
<div class="lb-setting">
  <div class="lb-setting-text"><span class="lb-setting-name" id="fx-l">Effects</span><p class="lb-note">Glow round lights, eyes and splashes.</p></div>
  <button class="lb-toggle" type="button" aria-pressed="true" aria-labelledby="fx-l">On</button>
</div>
```

## The game provides
- Nothing for the shared settings. For its own rows: a name and a one-line note saying what the player will see.

## Rules
- 72 by 44px (64 on a phone). `aria-pressed="true"`: `brass`, `on-brass` "On", 700, cut corners. `false`: a 1.5px `brass-dim` border, `text` "Off".
- The label changes with the state; colour is never the only sign. The whole row is the setting's label; only the button is pressed.
