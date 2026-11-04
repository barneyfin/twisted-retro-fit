# PlayScreen

The screen in play: the World filling the window, and the HUD in its corners. Nothing else goes over the picture.

## When to use
- Whenever the game is running.

## Markup
```html
<div class="lb-ui lb-hud">                    <!-- is-phone on a phone held sideways -->
  <div class="lb-hud-left">{Vitals}</div>
  <div class="lb-hud-right">{HudTile: full screen}{HudTile: pause}{WispCounter}</div>
</div>
```
On a phone: no full-screen tile (the title's tile does it), and the HUD sits 12px in and 10px down.

## The game provides
- The World (drawn with `LanternBox.world`), health, mana and the score.

## Rules
- The HUD is `space-5` (14px) from the picture's corners on a computer. The middle of the top edge and the whole bottom of the picture stay clear.
- Touch controls on a phone are designed with each game's play screen (for Gloam Hallow in step 4b) and go along the bottom, clear of the HUD.
- Hits, defeats, wisps and pick-ups happen in the World, never as text over it.

## Version 8
- The HUD as version 8 has it: see HUD (Vitals grown, the "?" tile, the boss bar in a fight, the phone's touch controls), with PlaqueLine and PlaceCard for the moments. The preview shows it live.
