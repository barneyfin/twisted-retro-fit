# PowerUp

A power-up is a small lightbox sign hovering over the road on its own pool of light, lettered with one Chinese character: the street's wall of signs, shrunk to something the taxi drives through.

## When to use
- Placed on the road by the game, in a lane, for the taxi to drive through and collect.
- Five kinds, one theme (Barney, 28 October 2026: option A, sign tokens). What each one does is decided with Grunge City Rider's gameplay (PRD question 4); the names below are placeholders until then.

## Markup
The game draws the token once with the 2D canvas into its texture, like the street's signs, and places it on the road like a car. As HTML (previews, mock-ups):
```html
<div class="cn-powerup is-time is-bobbing" style="--s:104px">
  <div class="cn-token"><span class="face"><span class="zh">時</span></span></div>
  <span class="pool"></span>
</div>
```
`--s` is the token's size; `.is-time`, `.is-fare`, `.is-speed`, `.is-shield`, `.is-double` set its face and ink.

## The game provides
- Which kind, where on the road (lane and distance), and what happens when the taxi collects it.

## Rules
- **The five**, each a sign face with its ink:

| Kind (placeholder) | Character | Face | Ink |
| --- | --- | --- | --- |
| More time | 時 time | `face-green` | `ink-cream` |
| Fare bonus | 錢 money | `face-yellow` | `ink-black` |
| Speed boost | 快 fast | `face-red` | `ink-yellow` |
| Shield, one free crash | 保 protect | `face-blue` | `ink-white` |
| Double fare | 雙 double | `face-cream` | `ink-red` |

- **Shape**: a square lightbox, `case` rim 3.7% of its size, corners 8.8%, face with the signs' light band and 1px light line, the character in `sign-zh` at 59% of the size. A glow of its own face colour round it, and a pool of the same colour on the wet road beneath it. No grain (`grain-signs`).
- **Size and place**: about 1.3 lane-markings tall at its distance, hovering a third of its height above the road; scaled with distance like the cars.
- **Telling them apart**: by colour first, then the character close up. Yellow and cream are light faces and blue, red and green dark ones, but green (時) and red (快) are almost the same lightness, so a red-green colour-blind player may mix those two up at a distance; the character and the meter's change tell them apart. Barney kept the colours as they are (28 October 2026); `face-teal` for 時 is the fix if players find it a problem.
- **Motion**: a slow bob, 1.6 s each way, a few pixels. No flashing or pulsing; with **Reduce motion** it holds still.
- **Collecting**: the token goes, and the meter shows the effect (the fare, the time, the speed). The game's own pick-up sound plays. A crash pop never plays for a pick-up.
- The five characters are on the word list for the Cantonese reader.
