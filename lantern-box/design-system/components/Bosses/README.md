# Bosses

One boss per place (version 6): black card like the monsters, graded charcoal to ink, with ember eyes, mouths, rim and glow, and a small nod to the level's colour: a few lit lines and the glow behind. Defeated, a boss breaks into card pieces and a large golden wisp rises.

## When to use
- At the end of each place's level: Night, the veiled ghost; Blood-red rain, the tentacled skull; Dawn, the moor mother; Mist, the gaping tree. What each does is decided with Gloam Hallow's gameplay.

## Code
```js
W.drawBosses(canvas, t, { level: "dawn", rm });   // the wanderer and the boss; a 7.5 s loop, defeated from 4.8 s to 7 s
const P = W.parts, cache = {};                      // keep one cache object per canvas
P.bossInto(c, s, level, t, W.options(level), dx, dy, P.BOSS_NOD, false, cache, P.BOSS_LOOK); // one boss, origin at (dx + 230s, dy + 300s)
P.bossDefeat(c, M, s, X, Y, u /* 0..1 */, seed, level, cache); // its card pieces over P.BOSS_BOXES[level], and the golden wisp
P.bossAura(level);                                  // the glow behind: [colour, height above the feet, radius, strength]
```

## The game provides
- The place, the boss's position and time, and the defeat's progress.

## Rules
- Black card cut-outs drawn like the monsters: each piece graded from `card-charcoal` inside to `ink` at its edge, inside a 2 to 3px ink edge; limbs, roots and antlers graded across their width; holes cut through for eyes and mouths, smouldering dark red inside. Put down the monster way: a 2.5px `ember` rim and an 11px `ember-glow` glow round the whole cut-out, then ember eyes, ember mouths with `bone` teeth, and seams.
- The nod to the level's colour, and only this: a few inner lines lit faintly in it (`boss-night-aura` …, at about 40 to 45%) and the glow behind (`boss-night-aura` …), which fades as the boss breaks and returns with it.
- Size: 1.2 times their first size (`boss-scale`), larger than the monsters. The ghost 247 picture pixels tall, the skull 206 tall and about 330 wide, the tree 255, the moor mother 270 to her antler tips; the walker is 194.
- Only the approved settings, `P.BOSS_LOOK` (graded, the skull's horns, the tree leaning with the wind) and `P.BOSS_NOD` (lit details and the glow behind). The boss functions still accept other values from the rounds when options were compared; never use them.
- The veiled ghost: a tall torn shroud bending one way then another, a paler front layer, a charcoal pointed hood, long low arms with hooked claws.
- The tentacled skull: a graded dome with two angular horns, a working jaw, jointed tentacles banded in two dark tones with suckers cut through them.
- The moor mother: smooth antlers with upturned points; a split face, a pale clouded dead eye (`boss-dawn-dead-eye`) beside an ember eye, fangs and a tusk; four small ember eyes on a spiked beast shoulder; long hair; a bony hand of long claws under a tattered sleeve; an armoured claw arm (spiked elbow, spined forearm, knuckled wrist) with an angular sickle blade toothed along its inner edge; a ragged robe that stops above four spider legs stepping in pairs. No tentacles, no purple or green.
- The gaping tree: leaning with the wind; a twisted trunk graded across its width and darkening to the base; a small skull's face in the bark (sockets with ember eyes, a gaping maw with splinter teeth), no nose and no ember seams; strong roots leaving the trunk like buttresses and spreading along the ground; two angular side branches below the crown at different heights; a crown of fine angular twigs; moss strands (`boss-mist-moss`). No arms, hands or legs.
- Poses change in steps (`puppet-steps`). Nothing flickers more than 3 times a second.
- Defeat: card pieces (4 by 3) over the boss's own box (`P.BOSS_BOXES`) tumble and fade as the glow fades; a large golden wisp (`wisp-gold`, glow `wisp-gold-glow` through `gold-light`) rises.
