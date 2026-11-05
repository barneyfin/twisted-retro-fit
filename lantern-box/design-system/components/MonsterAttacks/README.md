# MonsterAttacks

The five monsters made posable, each with its attack, the signal before it, the counter, and the hit reaction. Agreed in step 4b round 7.

## Code
`play.js`: posable kinds `crawlerP`, `bat2P`, `hatmawP`, `ghoulP`, `walkerP` drawn with `moDraw(ctx, K, key, s, m, t, o, flare)`; the duels in `MO_DUEL`; the wanderer's tracks (`wTrack`, `W_READY`, `W_ROLL`, `W_STRIKE` …).

## Rules
- The signal: a wind-up while its eyes flare and the part that will hurt burns (about 0.45 s, tuned on the Pixel). Sweeps leave an ember trail.
- A hit: it jolts back a puppet step and its ember rim flares once; one-hit monsters break up straight away.
- The walker's high sweep (arms up) passes over the standing wanderer: it catches him jumping or up on a piece, so arms up means **stay down** (don't jump), or roll. The low sweep (a crouch, arms back) means jump. The pair reads clearly: jump the low one, stay down for the high one (version 11).
- The ghoul's swipe outreaches the sword: it lurches about 30 forward as it swipes, reaching about 114 from where it stood (the sword reaches about 84). Roll through under it, then strike while it recovers, close to him (version 11).
- In a game, monsters are mirrored to face the wanderer (Barney's choice in step 4d); the design system draws them facing left (version 11).
- The signal eyes always sit on the monster's own eyes: one pair, at rest, moving and signalling (version 9).

## Version 9
- The mouth-hat's signal eyes follow its hop, as its own eyes do (`hatmawP` moves them with the same lift and squash as bundle.js's `hatmaw`). In version 8 they were drawn at fixed places, so a second pair showed whenever it was off the ground: at rest, and as it hopped in to bite. The crawler's and the flyer's own eyes never move, so their signal eyes already sat on them and are unchanged. The signals swell and flare as before (found by Barney on his Pixel while the kit was built, 4 November 2026).

## Version 11
- **The ghoul lurches** about 30 forward as it swipes (it stepped 8), and stays there for its recovery, so its swipe reaches further than the sword, as the gameplay note has it (`MO_DUEL.ghoul` in play.js; the arm is unchanged).
- **The walker's high sweep** is kept as drawn; its rule is now "stay down, or roll" (Barney, round 13). Lowering it to the wanderer's shoulders would need a stooping pose.
- Monsters face the wanderer in a game (recorded).
