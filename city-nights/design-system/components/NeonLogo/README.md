# NeonLogo

The game's name as the biggest neon sign on the street: a pink tube board with the name in two lines, and a vertical teal sign with its Chinese name beside it.

## When to use
- The title screen, top left, and only there.

## Markup
```html
<div class="cn-logo">
  <div class="cn-neon cn-vsign" aria-hidden="true"><span class="cn-tube is-teal"></span>
    <span class="cn-lit-teal">夜</span><span class="cn-lit-teal">更</span><span class="cn-lit-teal">的</span><span class="cn-lit-teal">士</span></div>
  <div class="cn-neon cn-logo-board"><span class="cn-tube is-pink" aria-hidden="true"></span>
    <h1 class="cn-logo-name cn-lit-pink"><span class="top">Grunge</span><span class="main">City Rider</span></h1></div>
</div>
```

## The game provides
- Its name, split into a short first line and a main line (sentence case in source; CSS sets it in capitals).
- Its Chinese name for the vertical sign, two to four characters, on the word list first. Grunge City Rider's is 夜更的士, night-shift taxi.

## Rules
- Board `neon-board`, `radius-board`, `shadow-board`, padding 30px 44px 32px 40px; the `tube-pink` tube 9px inside, 2.5px, `shadow-tube-pink`.
- Lettering `logo-top` over `logo-xl` in `tube-core-pink` with a 1.5px `tube-pink` edge and glow. If the main line is too long for 116px, drop it in steps to 88px rather than squeezing the letters.
- Vertical sign 74px wide, as tall as the board, `tube-teal` tube 7px inside, one character a line in `sign-zh-neon` at 40px in `tube-core-teal`.
- Invented names only; never a real game's title or logo.
