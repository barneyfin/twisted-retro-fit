# GracePick

After each boss, as the next place's card comes up: "Bind a twisted Grace", a free pick of one card from three, for that run only. Version 12, step 5b round 2 (Barney, 7 November 2026; PRD question 7).

## Markup
Under the PlaceCard's plaque: `lb-grace-pick` (`role="radiogroup"`): the heading as an `lb-flag`, then `lb-graces` (`is-phone` on a phone) of three `lb-grace` buttons, each a picture (`pic`, a 30-unit box of 1.8px strokes in `heading`, `solid` parts filled), its name (`nm`, IM Fell English) and line (`ln`); `is-selected` on the chosen one.

## Rules
- **When**: after each of the first three bosses, as the next place's card comes up: three picks a run, none before Night. The card holds, play stopped, until a Grace is taken; then it runs on as usual (the next place fades up behind it).
- **The draw**: three at random from the deck, never one already held this run. Each lasts for that run only. No Grace touches echo, so Graces change a run's score only through how well it is played.
- **The words**: the heading "Bind a twisted Grace"; the cards are called Graces everywhere.
- **The first deck** (agreed 7 November 2026): Keen Edge, "Your sword bites deeper."; Long Reach, "Your sword reaches further."; Deep Well, "Mana refills twice as fast."; Iron Skin, "Start every place with full armour."; Fleet Foot, "Rolls recover faster."; Kindled Heal, "Heal restores more."; Spell Surge, "Your attack spell costs less mana."; Lantern Ward, "The first hit in each place is ignored." Their sizes are starting figures in the gameplay note.
- **Pictures**: Keen Edge, Deep Well and Iron Skin as drawn in round 2; Long Reach (the sword with a corner beyond its tip), Fleet Foot (a turning arrow and speed lines), Kindled Heal (a heart under a flame), Spell Surge (the mana flame and a falling arrow) and Lantern Ward (a lantern between two arcs) are new in version 12.
- **Keys** (computers): left and right choose, Enter takes; a click or a tap on a card takes it at once. Phones: a tap. Every card is at least 44px.
- **Full Launch** (drawn, not built): "Bind a second Grace", a rewarded ad for a second pick at the same moment (AdPlaces).
- Interface changes are instant: the cards appear with the card's plaque and go with it.

## Version 13
Barney's decisions from building step 5e, and the new strong Graces (7 November 2026).

### Tiers
- Each of the three cards in an offer first rolls its tier, then a card of that tier at random: **common 76%, rare 20%, strong 4%** (starting figures, one number each to tune at 5f). Never a card already held; never a second strong Grace in a run (a strong roll after one is taken rerolls as rare). Within a tier every card has the same chance. This replaces the kit's per-card weights (Iron Skin, Lantern Ward, Deep Well 1; Spell Surge, Kindled Heal 2; Keen Edge, Long Reach, Fleet Foot 3): with only eight cards and nine shown a run, weights alone couldn't make a card feel rare (Iron Skin at weight 1 still came in about 60% of runs).
  - **Common**: Keen Edge, Long Reach, Fleet Foot, Kindled Heal, Spell Surge, and the five new commons (below): Quick Hands, Full Draught, Grave Robber, Steady Heart, Mana Thief.
  - **Rare**: Iron Skin, Lantern Ward, Deep Well.
  - **Strong**: The Grave Refuses, Reverberate, Marrow Feast.
  With these figures a strong Grace is offered in about one run in three, and about half of all offers hold a rare one.
- **The tier shows on the card** (Barney), as a word at the top of every card (Barney's words, 7 November 2026): **Frail** on a common card (`text-3`); **Potent** on a rare one, which also has a double brass edge (`is-rare`, the word in `brass`); **Malignant** on a strong one, which also has a `grace-strong` edge, softly lit corners (`grace-strong-glow`), and its picture, name and word in `grace-strong` (`is-strong`). The word is the clue besides colour and light; nothing flashes or moves. Every card's top padding grows to 24px (20 on a phone) to hold it.
- Strong Graces come in both runs, The Echo Infusion and The Bare Reckoning (Barney): the chase is the hook, and Graces already vary by luck.

### The strong Graces (starting figures; none touches echo)
- **The Grave Refuses**: once a run, instead of losing a life he rises where he stood, with half health and the second of safety. Picture: a cracked headstone under a rising chevron. Line (Barney, 7 November 2026): "When you fall, you draw breath once more." When it saves him: no lantern gutters; his card pieces gather back instead of scattering, the plaque line reads "The grave refuses you" with its picture, and the Grace is spent (dimmed on the pause screen).
- **Reverberate** (Barney's name and line, 7 November 2026; it was Doubled Curse): the attack spell repeats 0.15 s later, aimed the same way, for the same mana. Picture: two comets. Line: "The incantation kisses twice."
- **Marrow Feast** (Barney's name and line, 7 November 2026; it was Echo Hunger, which could suggest it earns echo): each monster defeated gives back 4% health; a boss 25%. Picture: a mended heart under three falling wisps. Line: "Replenish from the newly dead."

### Five new commons (Barney, 7 November 2026)
Barney asked for more commons to dilute the deck and vary what turns up most, and took all five proposed. Each is one rule (starting figures; none touches echo):
- **Quick Hands**, "Your sword swings faster.": sword recovery 15% shorter.
- **Full Draught**, "Potions restore more.": each potion restores 40% more.
- **Grave Robber**, "The dead give up more.": monsters drop loot half as often again.
- **Steady Heart**, "You recover longer after a hit.": the second of safety becomes 1.5 s.
- **Mana Thief**, "Each kill feeds your mana.": every defeat restores 5% mana.
The deck is now 10 common, 3 rare and 3 strong.

### Iron Skin and Lantern Ward
- **Iron Skin** keeps its line, "Start every place with full armour.": it fills all three pips at each place's start. Armour is now kept all run (HUD), so it matters most early.
- **Lantern Ward**, the hit it ignores: the lantern flares gold, a ring of ten gold motes opens from it, the ward chime plays (Sound); no damage, no knockback, then the second of safety's slow pulse (`fxWard`, `loopWard`). Once per place.

### Showing the Graces held
- On the pause screen, under its buttons: the Graces held, each its picture and name (PauseOverlay). Nothing on the HUD, so the phone's left side stays clear.
- When a Grace is bound, the plaque line shows its picture and name (PlaqueLine).

### The second loop
- The three Graces held carry into the second loop; there are no new picks there (Barney).
