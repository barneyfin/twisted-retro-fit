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

## Version 12
- **The wisp's echo** (PRD question 12, Barney, 7 November 2026): the soft rising note as a defeated monster's wisp rises becomes a short echo: the same note, then two to four repeats 0.16 s apart, each half as loud, darker and further into the room. Louder and longer the more echo it gives: 1, 2 or 5 from a monster, 25 from a boss's golden wisp (a fifth lower, after the boss's bell). `SND.play("defeat", v)` plays the card tear and the echo; `SND.play("echo", 25)` the echo alone. Starting levels (`GAIN.echo` as `defeat`), to measure at step 5d as the rest were.
- The run's end's READY uses the menus' soft chime (`confirm`); the win's three lines each come with one of the `win` sound's three bells.

## Version 13
- **The wisp's echo is louder and comes after the tear.** It plays at its own level (`ECHO_VOL`, 0.2, was 0.09), about 4 to 8 dB above the card tear, and in a defeat it starts as the tear ends (0.28 s; it was 0.18 s, under the tear). Claude Code found version 12's too quiet to hear. Starting figures.
- **Game over** (`gameOver`): one low, muted toll (110 Hz, its upper partials soft, a low thud under it), as the run's end's plaque appears, 0.8 s after the lost life's falling tones. As loud as the place card's toll.
- **The lightning bolt** (`bolt`), **the acid spray** (`acid`) and **its patch** (`acidHiss`): see Spells.
- **Lantern Ward** (`ward`): a glassy chime, bright and short (a bell at 1568 Hz with a high partial), as loud as the plaque line, when a hit is ignored.
- **Armour crack** now plays only at the run's end, as the pips crack in turn (HUD); a hit with armour has the usual hurt.
- Levels as measured offline over each sound's loudest 0.4 s: fireball −28, bolt −28.7, acid about −27, the plaque line and the ward −31.9, the place card −25.2 and game over −26.9, a monster defeated (1 echo) −27.1, a boss's echo (25) −23.4.
