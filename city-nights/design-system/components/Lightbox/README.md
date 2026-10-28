# Lightbox

The lit sign every panel is made from: a cream face in a dark case, a bilingual header, red ink, the red band for the main action.

## When to use
- Every panel during and after play: pause, settings, game over, initials, high scores, the rotate notice, a mode choice.
- Not on the title screen's menu, which is neon (TitleMenu). Not for the meter, which is drawn on the picture (Meter).

## Markup
```html
<div class="cn-ui cn-lightbox" role="dialog" aria-modal="true" aria-labelledby="hs-title" style="width:420px">
  <div class="cn-face">
    <h2 class="cn-header" id="hs-title"><span class="zh" lang="zh-Hant">高分榜</span><span class="en">High scores</span></h2>
    …content…
    <div class="cn-btns"><button class="cn-btn is-primary">Play again<span class="cn-kbd">Enter</span></button><button class="cn-btn">Menu</button></div>
  </div>
</div>
```

## The game provides
- Nothing for the shell's own panels. For its own panels: the header's two words (Chinese on the word list first), the content and the buttons.

## Rules
- Case: `case`, 5px rim, `radius-case`, `shadow-lightbox`. Face: the `lightbox-top` / `lightbox-mid` / `lightbox-low` blend at 0, 35 and 100%, `radius-face`, a 1px `lightbox-line` 3px inside. Padding 6px top, `space-5` round the rest; parts `space-4` apart.
- Header first, 54px tall: `header-zh` left, `header-en` right (uppercase by CSS), `heading-red`, a `rule-red` hairline under it.
- Text on the face: `panel-ink`, `panel-ink-2` for descriptions and labels. Numbers go in a dark `meter-face` inset as digits.
- One primary button, the red band (`band-red`, `on-band`, `shadow-band`), focused on open, with its keycap. Secondary buttons have a 1.5px `outline-ink` edge.
- Over the street, a lightbox dialog sits on `scrim`, centred.
- Keyboard focus on the face is a 2px `focus-light` ring.
