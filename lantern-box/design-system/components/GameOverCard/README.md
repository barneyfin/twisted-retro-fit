# GameOverCard

The end of a run: a plaque headed Game over, the score large in wisps, and either Continue (a top-ten score) or Play again, High scores and Menu.

## When to use
- When the run ends (the game decides how).
- If the score makes the top ten, the only button is Continue (primary), which leads to NameEntry and then HighScores. Otherwise the menu is Play again (selected), High scores and Menu.
- NEW BEST shows above the number only when the score beats the best on this device.

## Markup
```html
<div class="lb-ui lb-plaque" role="dialog" aria-modal="true" aria-labelledby="go-title" style="width:420px">
  <div class="lb-face" style="gap:12px;padding:22px 18px 18px">
    <h2 class="lb-heading" id="go-title">Game over</h2>
    <div class="lb-rule" aria-hidden="true"><i></i></div>
    <div class="lb-result">
      <p class="lb-flag">New best</p>            <!-- only when it beats the best -->
      <p class="lb-num lb-score-xl">1120</p>
      <p class="lb-unit">wisps</p>
    </div>
    <button class="lb-btn is-primary" type="button" style="width:100%">Continue</button>   <!-- or the MenuPanel -->
  </div>
</div>
```
On a phone held sideways (560px wide): `is-phone`, two columns: the heading, number and unit on the left, the menu (or Continue) on the right.

## The game provides
- The final score. The kit knows the best and the top ten.

## Rules
- The score is the largest thing on the plaque: `score-xl` (54px on a phone), tabular, not padded, `heading` with `glow-score`; WISPS under it in `unit`.
- NEW BEST in `flag` between two `brass` diamonds. It does not flash or pulse.
- Play again carries the diamond as the selected item. The primary control is focused on open.
