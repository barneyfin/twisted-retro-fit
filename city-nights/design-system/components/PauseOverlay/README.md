# PauseOverlay

The pause screen: the frozen street dimmed by `scrim`, with a centred lightbox headed 暫停 PAUSED listing Resume, Restart, Settings and Quit to menu.

## When to use
- Whenever play stops for the player: P or Esc, the pause tile, the window losing focus, leaving full screen, a phone turned upright (then RotateNotice shows instead until it is turned back).

## Markup
```html
<div class="cn-ui" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
  <div class="cn-scrim"></div>
  <div class="cn-lightbox" role="dialog" aria-modal="true" aria-labelledby="pause-title" style="position:relative;width:380px">
    <div class="cn-face">
      <h2 class="cn-header" id="pause-title"><span class="zh" lang="zh-Hant">暫停</span><span class="en">Paused</span></h2>
      {MenuPanel: Resume (selected, Esc), Restart, Settings, Quit to menu}
    </div>
  </div>
</div>
```

## The game provides
- A frozen world: the game loop and every sound stop, except a soft pause blip. The meter stays as it was, dimmed with the street.
- Focus moved into the dialog on open and back to the game on close.

## Rules
- Width `menu-width`. Resume is always first and selected; Esc resumes.
- Restart and Quit to menu discard the run; an arcade game does not ask "Are you sure?".
- Settings opens SettingsPanel over the same scrim; Done returns here.
