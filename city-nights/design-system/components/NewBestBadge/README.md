# NewBestBadge

A small yellow lightbox saying 新紀錄 NEW BEST: the interface's one reward mark.

## When to use
- On GameOverCard when the fare beats the best on this device. Nowhere else.

## Markup
```html
<div class="cn-badge"><span class="zh" lang="zh-Hant">新紀錄</span><span class="en">New best</span></div>
```

## The game provides
- Nothing: the kit decides when it shows.

## Rules
- `face-yellow` with the signs' lit-face shading, a 2px `case` rim and a yellow glow (`shadow-badge`), lettered in `ink-black` (`badge-zh`, `badge-en`).
- Sits under the game-over header, left. It does not flash or pulse.
