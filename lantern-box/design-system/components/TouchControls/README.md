# TouchControls

The phone's controls, held sideways: a stick under the left thumb and three buttons under the right. Agreed in step 4b round 9.

## Markup
In `HUD.build(stage, true)`: `lb-touch` with `lb-stick` (`lb-knob`) and three `lb-touch-btn` (jump, attack, cast; `is-small` for cast). Octagons drawn as SVG outlines over see-through faces (`touch-face`, `touch-face-light`, `touch-face-pressed`).

## Rules
- The stick appears where the left thumb lands, anywhere in the left half, and goes when it lifts; nothing shows at rest. A 112 px octagon base with chevrons for left, right and up only (down does nothing), a 50 px knob with a brass diamond; it travels 31 px. Up climbs only at a steep bank or a tall piece; a quick flick rolls (threshold tuned in play).
- The buttons in a triangle bottom right: jump and attack 64 px, cast 54 px above, showing the chosen spell. A pressed button's edge turns `heading`.
- The boss bar sits between the thumbs. No touch hint: the "?" tile's page explains.
