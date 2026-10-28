# SettingsPanel

The settings lightbox, headed 設定 SETTINGS: the arcade's shared Volume, Effects and Reduce motion, then City Nights' Picture, each with a one-line description.

## When to use
- From the title menu's Settings and from PauseOverlay. The same rows in every City Nights game, in this order; a game may add its own rows below in the same pattern.

## Markup
```html
<div class="cn-ui cn-lightbox" role="dialog" aria-modal="true" aria-labelledby="set-title" style="width:480px">
  <div class="cn-face">
    <h2 class="cn-header" id="set-title"><span class="zh" lang="zh-Hant">設定</span><span class="en">Settings</span></h2>
    <div><div style="display:flex;justify-content:space-between"><label class="cn-setting-name" for="vol">Volume</label><span class="cn-value">80%</span></div>
      <input class="cn-slider" id="vol" type="range" min="0" max="100" value="80" style="--v:80%"></div>
    <div class="cn-setting"><div><div class="cn-setting-name" id="fx-l">Effects</div><p class="cn-note">Glow around lights and signs.</p></div>
      <button class="cn-switch" role="switch" aria-checked="true" aria-labelledby="fx-l"></button></div>
    … Reduce motion; Picture as a cn-segments group …
    <button class="cn-btn is-primary">Done<span class="cn-kbd">Esc</span></button>
  </div>
</div>
```

## The game provides
- Nothing for the shared rows. The kit stores them under the arcade's shared keys, so a player sets them once for every game.
- The effect of each: Volume scales the master gain (0 mutes, and covers any soundtrack); Effects turns the glow pass off; Reduce motion cuts the taxi's sway and roll and stops panels rising; Picture sets the edge smoothing and sharpness.

## Rules
- Width 480px. Rows `space-4` apart; names `setting`, descriptions `note` in `panel-ink-2`, saying what the player will see, not how it works.
- Switches: `switch-off` with a `knob-off` knob when off; `band-red` with a `knob-on` knob when on. 56 by 32px; the whole row is a 44px target.
- Picture: Automatic, Best, Faster, Fastest as a `cn-segments` row, the chosen one the red band. Automatic is the default.
- The arcade's Solid panels setting is not shown (lightbox panels are already solid) and its saved value is left alone.
- Reduce motion starts from the device's `prefers-reduced-motion`. Changes apply at once; Done only closes the panel.
