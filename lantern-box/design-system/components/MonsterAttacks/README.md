# MonsterAttacks

The five monsters made posable, each with its attack, the signal before it, the counter, and the hit reaction. Agreed in step 4b round 7.

## Code
`play.js`: posable kinds `crawlerP`, `bat2P`, `hatmawP`, `ghoulP`, `walkerP` drawn with `moDraw(ctx, K, key, s, m, t, o, flare)`; the duels in `MO_DUEL`; the wanderer's tracks (`wTrack`, `W_READY`, `W_ROLL`, `W_STRIKE` …).

## Rules
- The signal: a wind-up while its eyes flare and the part that will hurt burns (about 0.45 s, tuned on the Pixel). Sweeps leave an ember trail.
- A hit: it jolts back a puppet step and its ember rim flares once; one-hit monsters break up straight away.
