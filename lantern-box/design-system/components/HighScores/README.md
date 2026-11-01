# HighScores

The top ten scores on this device: a plaque headed High scores, the newest row as the brass band.

## When to use
- From the title menu's High scores (one button: Back, with Esc).
- After NameEntry saves a score: the new row is the band, and the buttons are Play again (primary) and Menu.
- In a game with modes, one table per mode.

## Markup
```html
<div class="lb-ui lb-plaque" role="dialog" aria-modal="true" aria-labelledby="hs-title" style="width:420px">
  <div class="lb-face" style="gap:10px;padding:18px 22px 16px">
    <h2 class="lb-heading" id="hs-title" style="font-size:34px">High scores</h2>
    <div class="lb-rule" aria-hidden="true"><i></i></div>
    <table class="lb-scores">
      <thead><tr><th scope="col">No.</th><th scope="col">Name</th><th scope="col">Wisps</th></tr></thead>
      <tbody><tr><td>1</td><td class="who">MOR</td><td>2480</td></tr> … <tr class="is-new"><td>3</td><td class="who">BAR</td><td>1120</td></tr> …</tbody>
    </table>
    <div class="lb-btns"><button class="lb-btn is-primary has-diamond" type="button">Play again</button><button class="lb-btn" type="button">Menu</button></div>
  </div>
</div>
```
On a phone held sideways (660px wide, `is-phone`): an `lb-header` with the heading, Play again and Menu, then two tables of five side by side (`lb-scores-cols`).

## The game provides
- Nothing: the kit stores the table on the device, top ten per game, in the arcade's shared format, so the arcade's website shows every game's best.

## Rules
- Rows 28px (the new row 30px). Rank in `text-3`, initials spaced 0.1em in `text`, wisps right-aligned in `table-score` (tabular, not padded, `heading`).
- The newest row: `brass`, `on-brass`, 700.
- Empty table: one line, "No scores yet." in `text-3`.
