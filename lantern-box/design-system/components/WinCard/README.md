# WinCard

The win, after The Gaping Tree falls: Barney's two lines, the score as on game over, and the lives counted into it. Agreed in step 4b round 11.

## Markup
A dialog plaque (460 wide; 640 in two columns on a phone): `lb-heading` "The flesh yields.", `lb-win-line` "Gloam Hallow remembers not your suffering.", the rule, `lb-result` (NEW BEST when it beats the best), `lb-bonus` (LIVES LEFT, a lantern per life, the bonus), then the buttons.

## Rules
- Each lantern still lit adds its 10 in turn, half a second apart, the score stepping up with it; the counted lantern brightens once. Nothing flashes.
- Then as game over: Continue to the initials for a top-ten score, otherwise Play again, High scores and Menu. Later: Go round again (primary) or Finish; after the second loop, "Hysteria unlocked" as a flag like NEW BEST.

## Version 12
- **Three lines** (step 5b round 3, Barney, 7 November 2026): "A grim triumph." (the heading, 40px; 34 on a phone, `is-win`) over "The flesh yields." (`lb-win-line is-lead`, `heading`, 21px) and "Gloam Hallow remembers not your suffering.". They appear one at a time, each with one of the win's three bells (0, 0.7 and 1.4 s, the `win` sound), each instantly, before the score; then the lanterns count in as before (from 2.6 s, half a second apart).
- **The second loop** is offered, built before submission: the line "Fell The Wandering Rot to begin anew—walk the cursed path once more against darker terrors." (`lb-win-loop`, Barney's words, moved here from Hysteria's lock), then Go round again (primary, the diamond) and Finish, from 3.6 s, when the buttons take input. Finish goes on as game over does: the initials for a top-ten score, otherwise the run's end's buttons.
- The score is in echo. "Hysteria unlocked" is gone: Hysteria is bought at the Echo Shrine instead (Modes).
- Keys: Enter goes round again. Never Esc.

## Version 13
Gaps found building step 5e, settled with Barney (7 November 2026).
- **The echo stolen**: after the lanterns are counted (3.3 s), the line "{n} echo stolen" (`lb-daily lb-stolen`, as the run's end's daily line), so the win says what was banked, as the run's end does. On the day's first Echo Infusion run it carries the ×2 mark and the doubled figure. The ×2 never applies in The Bare Reckoning, as at the run's end.
- **After Finish** the offer gives way at once to the run's end's buttons: Play again (primary, focused), Echo Shrine and Menu; or, for a top-ten score in The Bare Reckoning, Continue alone, to the initials. The lines, the score and the echo stolen stay. Keys: Enter plays again, Backspace goes to the menu.
- **The second loop's win** has no offer (there is no third loop): its lines, the score, the echo stolen, then the end buttons at 3.6 s, when they take input. Its three lines are Barney's (7 November 2026): "A monstrous glory." (the heading, `is-win`) over "The greater horrors have bled dry." (`lb-win-line is-lead`) and "Gloam Hallow now fears your tread.", each with one of the win's three bells as on the first loop's win. Its echo is already doubled by the loop; the ×2 mark only ever means the day's first Echo Infusion.
- The phone keeps two columns: the lines left; the score, the lives, the echo stolen and the buttons right.
