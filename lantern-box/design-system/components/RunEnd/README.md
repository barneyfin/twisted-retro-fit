# RunEnd

The run's end in version 12: Game over with this run's echo banked, one honest near-miss line, a bar to the next unlock, and Play again focused within a second. It replaces GameOverCard in Gloam Hallow. Agreed in step 5b, rounds 1 and 2 (Barney, 7 November 2026).

## Markup
A dialog plaque (470 wide; 660 in two columns on a phone held sideways), as GameOverCard's with these parts added:
```html
<h2 class="lb-heading">Game over</h2>
<p class="lb-win-line">The rot overcomes you, but your echo remains.</p>
<div class="lb-rule" aria-hidden="true"><i></i></div>
<div class="lb-result"><p class="lb-num lb-score-xl">118</p><p class="lb-unit">echo</p></div>
<p class="lb-near">Fell to <span class="lb-near-name">The Tentacled Skull</span><span class="lb-near-bar"><i style="width:12%"></i></span><span><span class="lb-num">12%</span> left</span></p>
<p class="lb-daily"><span class="lb-daily-mark">×2</span>First Echo Infusion today: <span class="lb-num">236</span> echo stolen</p>   <!-- only then -->
<div class="lb-next">{the unlock's picture}<div class="lb-next-body"><p class="lb-next-row"><span>Next: Acid spray</span><span class="lb-togo"><span class="lb-num">86</span> to go</span></p>
  <div class="lb-echo-bar" role="meter" aria-label="Stolen echo towards the acid spray" aria-valuenow="214" aria-valuemin="0" aria-valuemax="300"><i class="was" style="width:32%"></i><i class="now" style="width:39%"></i></div></div></div>
<button class="lb-btn is-primary has-diamond">Play again</button>
<div class="lb-btns"><button class="lb-btn">Echo Shrine</button><button class="lb-btn">Menu</button></div>   <!-- is-lit on Echo Shrine when something is ready -->
<p class="lb-hint">{Enter} play again · {Backspace} menu</p>
```

## Rules
- **The words**: heading "Game over"; under it "The rot overcomes you, but your echo remains." (Barney, PRD question 9). The unit is echo, never "echoes".
- **The score** is this run's echo, the largest thing on the plaque (`score-xl`, not padded). Spending echo at the Echo Shrine never lowers a high score.
- **The near-miss line**, one of: "Fell to {boss} · {bar} · {n}% left" when he fell in a boss fight (the boss's name in IM Fell English, a small ember bar of what was left); otherwise "Furthest yet" (as `lb-ready`) with the place's name, when this run went further than any before. Nothing when neither is true.
- **The next unlock**: the cheapest thing at the Echo Shrine not yet bought, its picture (the spell's, the potion's socket, the belt's band), "Next: {name}" and "{n} to go"; the bar runs from 0 to its price, the stolen echo already banked darker (`wisp-pale-glow` at half), this run's echo bright (`wisp-pale`). When it can be bought: the name alone, READY (`lb-ready`), the bar full, and the Echo Shrine button lit (`is-lit`). When everything is bought, the block is left out.
- **The daily bonus**: the first Echo Infusion run of each day earns double echo. The line shows only on that run, with the doubled figure; it doubles only what that run earned, never the stored total, and never applies to The Bare Reckoning. No streak: missing a day loses nothing.
- **Buttons**: Play again (primary, the diamond) repeats the run just played; Echo Shrine and Menu side by side. High scores moved into Menu, so the table shows only after a top-ten score. A top-ten score in The Bare Reckoning has one button, Continue, to the initials and the table, as before. The Echo Infusion is never on the high scores.
- **The very first run** (and the first after Clear saved progress): the line "Your echo stays with you when a run ends. Spend it at the Echo Shrine.", "Spend your echo" as the primary button, then Play again and Menu. Only this once.
- **Keys** (computers): Enter for the primary button, Backspace for Menu; arrows move between buttons. Never Esc (a portal keeps it for leaving full screen).
- **Timing**: 0 to 0.8 s the last life falls as now (the blow, the knee, the card pieces) but with no fade to black: the scene holds still under the scrim. At 0.8 s the plaque appears (Interface changes are instant). From 0.8 to 2.0 s this run's echo steps into the bar, as the win counts its lanterns, and "to go" counts down with it; if an unlock is reached, READY lights once with the soft chime (`confirm`). At 1.0 s the buttons take input, so a jump or a swing mashed as he falls can't skip the screen. Nothing flashes.
- **Full Launch** (drawn, not built): "Double this run's echo", a rewarded ad, between the next unlock and Play again (AdPlaces).
- On a phone held sideways: two columns, the heading, line, score and near-miss left; the next unlock and the buttons right; no keyboard hints.

## Version 13
Gaps found building step 5e, settled with Barney (7 November 2026).
- **The phone's near-miss line is always two lines** (`lb-near is-two`, a break after the name): "Fell to {boss}", then the bar and "{n}% left". Claude Code found the one line wrapping for The Tentacled Skull at any share, and for The Veiled Ghost and The Moor Mother at 100%; one planned layout for every boss is steadier than a wrap that comes and goes. It fits 390.
- **Furthest yet**: when he fell outside a boss fight but got further than any run before, the line is "Furthest yet" (`lb-ready`, the brass diamond) beside the place's name, as built. Never both lines.
- **The ×2 line on a phone** sits in the left column, under the near-miss line, as built; the right column keeps the next unlock and the buttons.
- **A belt as the next unlock** shows its band in its colour in a 44px box (`lb-next-belt`), as at the Echo Shrine; "Next: Mulberry belt". Barney is happy with the band.
- **The game-over toll**: one low, muted toll (`SND.play("gameOver")`) as the plaque appears at 0.8 s, after the lost life's falling tones (Sound). It replaces nothing: the lost life's sound still plays as he falls.
- **The armour** cracks in turn as the last life goes, before the plaque (HUD).
