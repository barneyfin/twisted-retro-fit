# Monsters

The monster style, in five samples: black card puppets, graded charcoal to ink (version 6; lighter in version 7, matching the bosses), with ember eyes, an ember rim and inner detail, in three sizes. Each in turn is defeated: it breaks into card pieces and a pale wisp rises towards the score.

## When to use
- Every enemy in a Lantern Box game is drawn in this style. The five here (crawler and flyer; mouth-hat and ghoul; the walker) are the samples the look was signed off on; a game's own cast is designed in its step 4b.

## Code
```js
W.drawMonsters(canvas, t, { level: "night", rm });     // the sample strip, as on the directions page
// one monster, drawn into canvas c with its origin at (dx + 130s, dy + 230s):
W.scene(s).monsterInto(c, s, { kind: "ghoul2", X, Y, ph }, t, W.options(level), dx, dy);
// kinds: crawler, bat2 (the flyer), hatmaw (the mouth-hat), ghoul2, walker; their boxes in W.parts.MON_BOX
W.parts.drawDefeat(c, M, s, X, Y, box, u /* 0..1 */, "cardwisp", seed);
```

## The game provides
- Each monster's kind, place, pose phase and time; when it is defeated, the defeat's progress from 0 to 1 over 1.6 s.

## Rules
- Black card silhouettes with long angular limbs like the trees; card-puppet joints whose poses change in steps (`puppet-steps`, 8 a second; Reduce motion: smooth, half speed).
- Graded card pieces (version 6, as the bosses): every body piece is filled from `card-charcoal`, high on the monster, falling to `ink`, inside a 1.7px ink edge (1.2px on the crawler and the flyer); every limb segment 3 or more wide is graded across its width, `card-charcoal` (thin limbs `card-black-3`) on its upper side falling to `ink`. Hairline claws and twigs stay ink. `monsterInto` sets this up while it draws a monster (`CARD`, `W.parts.cardFill`, `W.parts.cardTaper`); outside it they draw plain ink.
- Danger is ember: eyes `ember` with `ember-eye-core` pupils, a 2.5px `ember` rim and an 11px `ember-glow` glow round the whole cut-out, ember throats (`ember-hot` at the back) with `bone` teeth, ember seams. Never on anything that is not a danger.
- Three sizes: small (crawler, flyer), medium (mouth-hat, ghoul), large (the walker, 15% wider than first drawn). The mouth-hat has no black-and-white stripes.
- Defeat: the cut-out splits into jagged card pieces that tumble away and fade; a pale wisp (`wisp-pale`, glow `wisp-pale-glow`) rises up and to the right towards the score. No blood, ever.
- The labels under the samples belong to this preview, not to games.
- In a game, monsters are mirrored to face the wanderer (Barney's choice in step 4d); the design system draws them facing left (version 11).

## Version 8
- Made posable for their attacks (`crawlerP`, `bat2P`, `hatmawP`, `ghoulP`, `walkerP` in play.js): see MonsterAttacks.

## Version 11
- Recorded: in a game, monsters are mirrored to face the wanderer (Barney's choice in step 4d). The drawings here face left.
