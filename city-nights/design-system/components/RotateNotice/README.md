# RotateNotice

What a phone held upright shows: a lightbox headed 橫放手機 ROTATE asking the player to turn the phone sideways, over the dimmed street.

## When to use
- Whenever a phone or tablet is upright. Play pauses; turning the phone back shows PauseOverlay, so the player resumes when ready.

## Markup
```html
<div class="cn-ui" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center">
  <div class="cn-scrim"></div>
  <div class="cn-lightbox" role="dialog" aria-labelledby="rot-title" style="position:relative;width:326px">
    <div class="cn-face is-centred">
      <h2 class="cn-header" id="rot-title"><span class="zh" lang="zh-Hant">橫放手機</span><span class="en">Rotate</span></h2>
      {rotate-phone picture, 84px, ink-red}
      <p class="cn-setting-name">Rotate your phone</p>
      <p class="cn-note">Grunge City Rider plays with the phone held sideways.</p>
    </div>
  </div>
</div>
```

## The game provides
- Its name for the second line.

## Rules
- Width 326px on a 390px-wide phone, centred, on `scrim`. Header `header-zh` at 28px.
- No buttons: turning the phone is the only way out.
