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
