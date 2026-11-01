# Plaque

The brass plaque: a dark face inside a thin brass edge, its corners cut. Every Lantern Box screen but the title is one.

## When to use
- Every dialog (pause, settings, game over, initials, high scores, the rotate notice) and every HUD panel.
- Not the title screen: that is the lancet arch (TitleArch).

## Markup
```html
<div class="lb-ui lb-plaque" role="dialog" aria-modal="true" aria-labelledby="p-title" style="width:420px">
  <div class="lb-face">
    <h2 class="lb-heading" id="p-title">Game over</h2>
    <div class="lb-rule" aria-hidden="true"><i></i></div>
    … the plaque's content …
  </div>
</div>
```
- `lb-plaque is-hud` for HUD panels (`hud-face`, `chamfer-hud`); `lb-plaque is-phone` for the phone layouts (smaller padding, gaps and type).
- `lb-face is-centred` centres the content.
- `lb-header` puts the heading at the left with buttons beside it and a `rule-dark` hairline under it (phone settings and high scores).

## The game provides
- The width (each screen's component gives it) and the content. Plaques sit centred on `scrim` over the picture.

## Rules
- The edge is `brass` at 1.5px; the face `plaque-face` (dialogs) or `hud-face` (HUD). Corners are cut by `chamfer-plaque` (10px; the face 9.4px), `chamfer-hud` (8px) or `chamfer-control` (6px), with a clip-path polygon, never `border-radius`.
- Padding `space-7` top, `space-6` sides and bottom; parts `space-5` apart (phone: 18px 14px 14px, parts `space-3` apart).
- The heading (`heading`, 30px on a phone) comes first, centred, then the rule: two `brass-dim` lines with a `brass` diamond.
- No drop shadow, no glow. One plaque at a time; settings replace pause rather than stacking on it.
