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

## Version 13
- **The Graces bound** this run show under the plaque (Barney, 7 November 2026), so a player can see what the run holds without crowding the HUD: an `lb-flag` "Graces bound", then a row (`lb-held-list`) of up to three, each its picture (22px, the GracePick picture) and name (`lb-held-item`), in the order bound. A strong Grace is outlined in `grace-strong` (`is-strong`).
- Before the first boss there are none, and the row isn't shown. In the second loop it shows the three carried over.
- A Grace that acts once (The Grave Refuses) stays listed once spent, at half opacity (`is-spent`), with ", spent" for screen readers.
- The plaque and the row are centred together; on a phone 10px apart, on a computer 14px. The preview's backdrops are now the live places drawn by play.js.
