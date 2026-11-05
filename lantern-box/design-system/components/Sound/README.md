# Sound

Every sound in the game: effects made in code as the kit makes its sounds, two of Barney's recordings, and each place's background. Agreed in step 4b round 12 (Barney, 4 November 2026).

## Code
`play.js`: `SND.unlock()` (on the first key or tap), `SND.play(name)`, `SND.ambient(place)`, `SND.stopAmb()`. The parts: `tone`, `noise` (filtered, optionally torn), `bell` and `ring` (inharmonic partials), `voice`, `rumble`, a generated dark room every sound sends a little to; the recordings decoded from `SND_CLIPS`.

## Rules
- Effects: sword swing (a quick whoosh) and hit (a blade's crack and a short metal ring); jump (a cloth flap), land (a soft thud), roll; the hurt; armour crack (a metal clang and a crunch); monster defeated (a card tear, a soft rising wisp note); pick-up (two glints); heal (a warm chord); a potion drunk (the cork, two quick swallows, a short warm chord rising: lower for health, brighter for mana; version 11); fireball (a fluttering roar with crackles) and its burst (the same, bigger and longer); not enough mana (a spark and a hiss); the checkpoint (the spark, a small chime); the plaque line (a light chime); life lost (falling tones, scattering cards); boss arrives (a deep growling swell); boss defeated (a deep bell); the place card (a low toll); the win (three bells). Lantern Box's menus: a muted tick, a soft chime, a falling tick.
- Two are Barney's recordings (Pixabay, royalty-free, no attribution required; ARCADE.md allows short sound effects since 4 November 2026): the hurt, the first burst of "66 voz hombre dolido" (Pixabay 100206); the crows' caws, seven from "Crow sound effect HD" (Pixabay 336784), two to four in a call, each call pitched a touch apart. 45 KB together.
- Places, quiet under the music: Night wind and bats; Blood Red Rain rain (made as City Nights makes it) and thunder (a ripping crack, a long uneven roll); Dawn moor wind and crows; Mist creaking trees, wind in the leaves, crows.
- Levels by measured loudness (`GAIN`, `BED`, `EV`): the big moments loudest, then the main actions, then light touches, then the menus; in each place its sounds above its wind or rain. Starting figures, to tune by ear.

## Version 11
- `drinkHealth` and `drinkMana` (`DRINK` in play.js): the cork (a short filtered noise), two quick swallows (low falling tones), then a short warm chord rising (349, 440, 523 Hz for health; 587, 740, 880 for mana). A new sound rather than the heal's chord, so a potion and the heal spell sound different. Measured as the heal and the pick-up are, a light touch (GAIN 2.37 and 2.36).
