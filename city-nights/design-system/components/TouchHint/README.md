# TouchHint

A dark plaque at the bottom centre of a phone's picture that tells the player how to control the game.

## When to use
- On touch devices only, before the first move of each run. Hide it on the first touch.
- Keyboard players get Keycap hints on the title screen instead.

## Markup
```html
<div class="cn-ui cn-touch-hint">{drag-arrows icon}<span>Left: drag to steer · Right: hold to brake</span></div>
```

## The game provides
- One sentence-case line, two actions at most, joined by a middle dot, and the icon for the main gesture.
- When the two sides of the screen do different things, the line says which side does what.

## Rules
- `plaque` ground, 6px corners, a 1px `meter-rule` edge, 13px `hint` type in `night-text`, a 16px icon.
- Bottom centre, 12px above the bottom edge plus the safe-area inset.
- Over the picture only until the player moves. Never over the taxi.
- Grunge City Rider's line is "Left: drag to steer · Right: hold to brake" (Barney, 31 October 2026, with the side rule; until then "Drag to steer · Hold with your other thumb to brake"). The horn's quick tap, on either side, is left for players to find. Where thumbs may go, and what each side does, is TouchZones.
