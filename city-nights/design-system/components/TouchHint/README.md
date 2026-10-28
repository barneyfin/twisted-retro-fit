# TouchHint

A dark plaque at the bottom centre of a phone's picture that tells the player how to control the game.

## When to use
- On touch devices only, before the first move of each run. Hide it on the first touch.
- Keyboard players get Keycap hints on the title screen instead.

## Markup
```html
<div class="cn-ui cn-touch-hint">{drag-arrows icon}<span>Drag to steer · Hold with your other thumb to brake</span></div>
```

## The game provides
- One sentence-case line, two actions at most, joined by a middle dot, and the icon for the main gesture.
- When a game wants both thumbs (steer with one, act with the other), the line says so.

## Rules
- `plaque` ground, 6px corners, a 1px `meter-rule` edge, 13px `hint` type in `night-text`, a 16px icon.
- Bottom centre, 12px above the bottom edge plus the safe-area inset.
- The only interface element over the picture during play besides the meter, caption and tiles, and only until the player moves. Never over the taxi.
- The line in the preview is Grunge City Rider's provisional wording; its controls are settled with its gameplay.
