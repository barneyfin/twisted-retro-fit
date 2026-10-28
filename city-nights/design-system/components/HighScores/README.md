# HighScores

The top ten fares on this device: a lightbox headed 高分榜 HIGH SCORES, the table on a dark meter face, the newest row lit.

## When to use
- From the title menu's High scores (one button: Back, Esc).
- After NameEntry saves a fare: the new row is lit, and the buttons are Play again (primary, Enter) and Menu.
- In a game with modes, one table per mode, with a tab per mode above it.

## Markup
```html
<div class="cn-ui cn-lightbox" role="dialog" aria-modal="true" aria-labelledby="hs-title" style="width:420px">
  <div class="cn-face">
    <h2 class="cn-header" id="hs-title"><span class="zh" lang="zh-Hant">高分榜</span><span class="en">High scores</span></h2>
    <div class="cn-scores-wrap"><table class="cn-scores">
      <tr class="is-new"><td class="rank">1</td><td class="who">BAR</td><td class="fare"><span class="cn-sr">HK$412.80</span><div data-cn-digits="412.80" data-h="18"></div></td></tr>
      …
    </table></div>
    <div class="cn-btns"><button class="cn-btn is-primary">Play again<span class="cn-kbd">Enter</span></button><button class="cn-btn">Menu</button></div>
  </div>
</div>
```

## The game provides
- Nothing: the kit stores the table on the device, top ten per game, in the arcade's shared high-score format, so the arcade's website shows every game's best.

## Rules
- Rows 30px: rank in `meter-dim` (the new row's in `rank-new`), initials in `initials` type and `night-text`, fares as 18px digits, right-aligned.
- The newest row: `row-new` with a 1px `row-new-line` edge.
- Empty table: one line in the inset, "No fares yet. Be the first."
