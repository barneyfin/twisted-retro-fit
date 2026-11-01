# SettingsPanel

The settings plaque: the arcade's shared Volume, Effects and Reduce motion, then Lantern Box's Picture, each saying what the player will see.

## When to use
- From the title menu's Settings and from PauseOverlay. The same rows in every Lantern Box game, in this order; a game may add rows below in the same pattern.

## Markup
```html
<div class="lb-ui lb-plaque" role="dialog" aria-modal="true" aria-labelledby="set-title" style="width:500px">
  <div class="lb-face" style="padding:20px 22px 18px">
    <h2 class="lb-heading" id="set-title">Settings</h2>
    <div class="lb-rule" aria-hidden="true"><i></i></div>
    {Slider: Volume} {Toggle: Effects} {Toggle: Reduce motion}
    {Picture: name and Segments in one line, the note under them}
    {Esc done hint, then the Done button, right-aligned}
  </div>
</div>
```
On a phone held sideways (680px wide): `lb-plaque is-phone`, an `lb-header` with the heading left and Done right, then two columns: Volume, Effects and Reduce motion on the left; Picture as a two-by-two Segments grid and its note on the right.

## The game provides
- Nothing for the shared rows. The kit stores them under the arcade's shared keys, so a player sets them once for every game.

## Rules
- Volume scales the master gain; Effects off draws lights, eyes and splashes without their glow; Reduce motion as in the README's Motion and safety; Picture sets the detail, Automatic by default.
- Reduce motion starts from the device's `prefers-reduced-motion`. Changes apply at once; Done or Esc only closes the plaque.
- Descriptions in `note`, `text-3`; rows split by `rule-row`.
- The arcade's Solid panels setting is not shown, and its saved value is left alone.
