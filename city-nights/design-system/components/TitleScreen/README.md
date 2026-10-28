# TitleScreen

The title screen assembled: the street behind a shade, the neon logo and title menu on the left, the best fare under them, neon tiles top right, keyboard hints bottom left.

## When to use
- Every game's first screen, and where Quit to menu and Menu lead. The street drives on slowly behind it.

## Markup
```html
<div class="cn-ui" style="position:absolute;inset:0">
  <div class="cn-title-shade"></div>
  <div style="position:absolute;left:56px;top:52px;display:flex;flex-direction:column;align-items:flex-start;gap:22px">
    {NeonLogo} {TitleMenu} {BestPlaque}
  </div>
  <div class="cn-tiles" style="position:absolute;right:24px;top:24px">{neon IconTiles: sound, full screen}</div>
  <div class="cn-plaque cn-keys" style="position:absolute;left:56px;bottom:24px">{the game's keys}</div>
</div>
```

## The game provides
- Its name and Chinese name (NeonLogo), and its keys for the hints.

## Rules
- The left column starts 56px in and 52px down on a 1280-wide window, parts 22px apart. On touch devices the keyboard hints are hidden. How the column fits a phone's 390px height is settled with the code kit.
- The taxi stays visible: nothing covers the centre or right of the road.
- The first key or tap also starts the audio.
