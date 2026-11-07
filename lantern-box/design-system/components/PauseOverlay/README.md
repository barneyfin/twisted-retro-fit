# PauseOverlay

The pause screen: the frozen place dimmed by the scrim, and a centred plaque headed Paused with Resume, Restart, Settings and Quit to menu.

## When to use
- Whenever play stops for the player: P, the pause tile, the window losing focus, leaving full screen, a phone turned upright (the rotate notice shows instead until it is turned back).

## Markup
```html
<div class="lb-ui" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
  <div class="lb-scrim"></div>
  <div class="lb-plaque" role="dialog" aria-modal="true" aria-labelledby="pause-title" style="position:relative;width:340px">
    <div class="lb-face" style="padding:22px 16px 16px">
      <h2 class="lb-heading" id="pause-title">Paused</h2>
      <div class="lb-rule" aria-hidden="true"><i></i></div>
      {MenuPanel: Resume (selected), Restart, Settings, Quit to menu}
      <p class="lb-hint" style="text-align:center">{P keycap} resume</p>
    </div>
  </div>
</div>
```
On a phone: `lb-plaque is-phone`, 300px wide, no hint.

## The game provides
- A frozen world: the game loop and every sound stop. The HUD stays as it was, dimmed with the place.

## Rules
- Resume is always first and selected; P resumes.
- Restart and Quit to menu discard the run without asking: arcade-style.
- Settings opens SettingsPanel in its place; Done returns here.

## Version 12
- P pauses and resumes, and the hint reads "P resume": never Esc, which a portal keeps for leaving full screen. The arcade's own build still lets Esc pause, unshown; the CrazyGames build never listens for it.
