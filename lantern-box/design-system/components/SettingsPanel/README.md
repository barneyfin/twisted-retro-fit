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
    {Credits row} {Clear saved progress row}
    {Backspace done hint, then the Done button, right-aligned}
  </div>
</div>
```
On a phone held sideways (680px wide): `lb-plaque is-phone`, an `lb-header` with the heading left and Done right, then two columns: Volume, Effects and Reduce motion on the left; Picture as a two-by-two Segments grid and its note on the right.

## The game provides
- Nothing for the shared rows. The kit stores them under the arcade's shared keys, so a player sets them once for every game.

## Rules
- Volume scales the master gain; Effects off draws lights, eyes and splashes without their glow; Reduce motion as in the README's Motion and safety; Picture sets the detail, Automatic by default.
- Reduce motion starts from the device's `prefers-reduced-motion`. Changes apply at once; Done or Backspace only closes the plaque.
- Descriptions in `note`, `text-3`; rows split by `rule-row`.
- The arcade's Solid panels setting is not shown, and its saved value is left alone.

## Version 12
- **Two rows added** (step 5b round 3, Barney, 7 November 2026), below Picture: **Credits**, with an Open button (Credits); **Clear saved progress**, with a Clear button outlined in `ember` (`lb-btn is-danger`), the one destructive button in the game. To fit 540 on a computer the two share one row, split by a hairline, and the plaque widens to 560 (from 500), 14px from the top with parts 10px apart; neither has a note (round 3's "Who made the game, its music and type." and "Stolen echo and everything bought." don't fit; the confirmation says what clearing does). On a phone, Credits goes under Reduce motion and Clear saved progress under Picture's note.
- **The confirmation** (`role="alertdialog"`, 400 wide; 440 on a phone): "Clear saved progress?", "Your stolen echo and everything bought at the Echo Shrine will be gone, and the next run starts as a first run, hints and all. High scores and settings stay.", then Keep it (primary, focused) and Clear it (`is-danger`). Enter keeps it; Backspace goes back.
- Clearing removes the stolen echo and everything bought, Hysteria included, and brings the first-run hints back; high scores and settings stay. It writes the one saved record, through the one storage function.
- The hint is "Backspace done": never Esc, which a portal keeps for leaving full screen.
