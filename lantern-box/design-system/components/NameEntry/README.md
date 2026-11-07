# NameEntry

Three initials chosen letter by letter, after a score that makes the top ten: a plaque headed New best.

## When to use
- After GameOverCard's Continue, when the score enters the top ten. Skipped when it does not.

## Markup
```html
<div class="lb-ui lb-plaque" role="dialog" aria-labelledby="ne-title" style="width:400px">
  <div class="lb-face is-centred" style="padding:22px 18px 18px">
    <h2 class="lb-heading" id="ne-title">New best</h2>
    <div class="lb-rule" aria-hidden="true"><i></i></div>
    <p class="lb-hint" style="font-size:17px;color:var(--text-2)"><span class="lb-num" style="font-size:20px">1120</span> echo. Enter your initials.</p>
    <div class="lb-slots" role="group" aria-label="Initials">
      <div class="lb-slot-col"><span class="lb-chev is-blank"></span><span class="lb-slot">B</span><span class="lb-chev is-blank"></span></div>
      <div class="lb-slot-col">{up chevron}<span class="lb-slot is-selected" aria-current="true">A</span>{down chevron}</div>
      <div class="lb-slot-col"><span class="lb-chev is-blank"></span><span class="lb-slot is-unset">A</span><span class="lb-chev is-blank"></span></div>
    </div>
    <p class="lb-hint">{up}{down} letter · {left}{right} move · <span class="lb-kbd">Enter</span> done</p>
    <button class="lb-btn is-primary" type="button">Done</button>
  </div>
</div>
```
On a phone held sideways (580px wide, `is-phone`): two columns. Left: the heading, "1120 echo. Tap a letter, then the arrows to change it." and Done. Right: the slots as buttons (`lb-slot-btn`, 60 by 70px); the selected one has 44px arrow buttons above and below (`lb-arrow-btn`), Next letter and Previous letter.

## The game provides
- Nothing: the kit handles the letters and saves the row.

## Rules
- Letters A to Z, 0 to 9 and a dot. Up and down change the letter, left and right move, Enter saves. The last initials entered are filled in.
- Slots 64 by 76px, letters in `initial` (46px on a phone). Chosen: `brass-deep` edge, `text` letter. Selected: a 2px `brass` edge, `brass-wash`, `shadow-slot`, `heading` letter, `heading` chevrons above and below. Not yet chosen: `text-dim`.
- High scores stay on the device, top ten per game, in the arcade's shared format.
