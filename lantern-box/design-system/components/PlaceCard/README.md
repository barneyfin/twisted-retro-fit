# PlaceCard

Between places (and before Night at the start of every run): the place fades to black, a plaque with the next place's name over the rule and its words below, and the next place fades up behind it. Agreed in step 4b round 10.

## Markup
`<div class="lb-card"><div class="lb-plaque"><div class="lb-face is-centred"><h2 class="lb-heading">Dawn</h2><div class="lb-rule"><i></i></div><p class="lb-card-sub">The Open Moor</p></div></div></div>`

## Rules
- 3 s, play stopped: the place and the HUD fade to black (0.5 s); the card comes up (0.4 s); the next place fades up behind it from 1.9 s; the card goes from 2.4 s. At Dawn's card, the soundtrack's track 2 begins.
- The words are proper names, capitalised: Night, The Graveyard; Blood Red Rain, The Old Town; Dawn, The Open Moor; Mist, The Wind Bent Forest.
- It follows the wanderer walking on out of the boss's arena; Mist's end leads to the win instead.

## Version 13
- **The second loop's cards** say so: "Again, harder" under the place's name, above the rule (`lb-card-again`: 13px, 600, spaced capitals in `brass`; 12px on a phone), on all four cards from Night's. Nothing else marks the second loop: not the HUD (Barney, 7 November 2026). It replaces the plaque line "Again, harder".
- `brass`, not `ember`: in the interface ember is kept for the one destructive button.
- After each of the first three bosses of the first loop the card holds for the Grace pick (GracePick); on the second loop there are no picks, and the three Graces held carry on.
