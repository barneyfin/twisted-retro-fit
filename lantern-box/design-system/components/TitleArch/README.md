# TitleArch

The lancet arch: a gothic arch cut from black card, lit from behind, holding the game's name, the title menu and the best score. The title screen only.

## When to use
- Every Lantern Box game's title screen (TitleScreen). Nowhere else: every other screen is a plaque.

## Markup
```html
<div class="lb-ui lb-arch">                 <!-- add is-phone for 260 x 374 -->
  <div class="lb-arch-card"></div>
  <div class="lb-arch-inner">
    <h1 class="lb-title">Gloam<br>Hallow</h1>
    <div class="lb-rule is-arch" aria-hidden="true"><i></i></div>
    <nav class="lb-title-menu" aria-label="Title menu">
      <button class="lb-title-item is-selected" type="button" aria-current="true">Start game</button>
      <button class="lb-title-item" type="button">High scores</button>
      <button class="lb-title-item" type="button">Settings</button>
    </nav>
    <p class="lb-best">Best <span class="lb-num">0450</span> wisps</p>
    <p class="lb-hint">{up} {down} choose · <span class="lb-kbd">Enter</span> select</p>   <!-- computers only -->
  </div>
</div>
```

## The game provides
- Its name, broken over two lines where it reads best (two short words: one each). The kit gives the best score and the menu.

## Rules
- 340 by 488px on a computer, 260 by 374 on a phone held sideways. The card is `ink`, its top a pointed arch, its foot torn ragged (the clip paths in `bundle.css`), lit from behind by `arch-filter` (the phone's glow is 14px and 34px).
- Inside, centred, from 80px down (58 on a phone), 15px apart (9): the name in `title-xl` (46px on a phone), `title-letter` with `glow-title`; a rule in `arch-edge`; the menu; the Best line; the hint.
- The selected item is lit, not banded: `title-selected`, 700, `glow-title-item`, a `gold-light` candle flame before it. Others `title-item`. Hover lights an item to `title-selected` without the flame.
- Best is `best` type, padded to four places, in `title-letter`; its label in `title-item`. Before any score: Best 0000 wisps.
- Hint `hint` at 13px in `title-hint`, keycaps in `title-key` and `title-key-line`. Computers only.

## Version 8
- Four items: Start game, How to play, High scores, Settings. Inside the same arch everything moves up and closes in to fit (`lb-arch has-four`: padding 70px, gaps 12px, items 42px tall; on a phone padding 48px, gaps 6px, items 44px, the name 42px).
