# BestPlaque

The best fare on this device, in red digits on a small meter face: the title screen's one number.

## When to use
- The title screen, under the title menu. Left out when there is no score yet.

## Markup
```html
<div class="cn-ui cn-best">
  <div class="lab"><span class="zh" lang="zh-Hant">最佳</span><span class="en">BEST  HK$</span></div>
  <div data-cn-digits="386.40" data-h="30"></div>
  <span class="cn-sr">Best fare HK$386.40</span>
</div>
```

## The game provides
- Nothing: the kit reads the best fare from the device's high-score table.

## Rules
- `meter-face` ground, 6px corners, a 1px `meter-rule` edge; label `zh-sans` 15px over `ui` 13px in `meter-label`; digits 30px.
- No commas or HK$ inside the digits; the label carries HK$.
