# GameOverCard

The end of a run: a lightbox headed 遊戲結束 GAME OVER, the final fare large in red digits, the best beneath, and either Continue or Play again and Menu.

## When to use
- When the run ends (the game decides how).
- If the fare makes the top ten, the only button is Continue (primary), which leads to NameEntry and then HighScores. Otherwise the buttons are Play again (primary) and Menu.
- The New best badge shows only when the fare beats the device's best. The line under the fare reads "Previous best" then, "Best" otherwise, and is left out when there is no earlier fare.

## Markup
```html
<div class="cn-ui cn-lightbox" role="dialog" aria-modal="true" aria-labelledby="go-title" style="width:420px">
  <div class="cn-face">
    <h2 class="cn-header" id="go-title"><span class="zh" lang="zh-Hant">遊戲結束</span><span class="en">Game over</span></h2>
    <div class="cn-badge"><span class="zh" lang="zh-Hant">新紀錄</span><span class="en">New best</span></div>
    <div class="cn-inset"><div class="cn-inset-label"><span class="zh">車資</span><span class="en">FARE  HK$</span></div>
      <div data-cn-digits="412.80" data-h="64" style="justify-content:flex-end"></div></div>
    <div style="display:flex;gap:10px;align-items:baseline"><span class="cn-label">Previous best</span><span class="cn-value">HK$386.40</span></div>
    <button class="cn-btn is-primary">Continue<span class="cn-kbd">Enter</span></button>
  </div>
</div>
```

## The game provides
- The final fare. The kit knows the best and the top ten.

## Rules
- Sits on `scrim` over the last frame of play, centred, `dialog-width`.
- The fare is the largest thing on the card: 64px digits, right-aligned in a `meter-face` inset labelled 車資 FARE HK$. No stats table; one optional extra line in `label` + `value`.
- The primary button is focused on open.
