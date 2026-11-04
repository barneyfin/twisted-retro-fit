# MonsterAttacks

The five monsters made posable, each with its attack, the signal before it, the counter, and the hit reaction. Agreed in step 4b round 7.

## Code
`play.js`: posable kinds `crawlerP`, `bat2P`, `hatmawP`, `ghoulP`, `walkerP` drawn with `moDraw(ctx, K, key, s, m, t, o, flare)`; the duels in `MO_DUEL`; the wanderer's tracks (`wTrack`, `W_READY`, `W_ROLL`, `W_STRIKE` …).

## Rules
- The signal: a wind-up while its eyes flare and the part that will hurt burns (about 0.45 s, tuned on the Pixel). Sweeps leave an ember trail.
- A hit: it jolts back a puppet step and its ember rim flares once; one-hit monsters break up straight away.
- The signal eyes always sit on the monster's own eyes: one pair, at rest, moving and signalling (version 9).

## Version 9
- The mouth-hat's signal eyes follow its hop, as its own eyes do (`hatmawP` moves them with the same lift and squash as bundle.js's `hatmaw`). In version 8 they were drawn at fixed places, so a second pair showed whenever it was off the ground: at rest, and as it hopped in to bite. The crawler's and the flyer's own eyes never move, so their signal eyes already sat on them and are unchanged. The signals swell and flare as before (found by Barney on his Pixel while the kit was built, 4 November 2026).
