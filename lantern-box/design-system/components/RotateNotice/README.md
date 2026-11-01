# RotateNotice

What a phone held upright shows: a plaque asking the player to turn the phone sideways, on a dark glow.

## When to use
- Whenever a phone or tablet is upright. Play pauses; turning the phone back shows PauseOverlay, so the player resumes when ready.

## Markup
```html
<div class="lb-ui lb-rotate">
  <div class="lb-plaque" role="dialog" aria-labelledby="rot-title" style="width:300px">
    <div class="lb-face is-centred">
      <span style="color:var(--heading)">{rotate-phone picture, 84px}</span>
      <h2 class="lb-heading" id="rot-title">Turn your phone sideways</h2>
      <p>Gloam Hallow is played with the phone held sideways.</p>
    </div>
  </div>
</div>
```

## The game provides
- Its name for the sentence.

## Rules
- The ground is a radial glow, `rotate-glow` through `night-sky-1` to `ink`, not the picture. The plaque is 300px wide on a 390px-wide phone, centred.
- Heading at 30px, line height 1.05; the sentence in `body`, `text-2`.
- No buttons: turning the phone is the only way out.
