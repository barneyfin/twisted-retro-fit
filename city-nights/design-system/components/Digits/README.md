# Digits

Red seven-segment numbers, slanted, with the unlit segments showing: how every number in City Nights is shown.

## When to use
- Every fare and number on a dark `meter-face` inset: the meter's rows, the best fare on the title, the final fare on game over, the high-score table.
- Never for words, and never on the lightbox face. A fare in a sentence is text (`value`: "HK$386.40").

## Markup
```html
<div data-cn-digits=" 23.40" data-h="44"></div>
<script>CityNights.mountDigits();</script>
```
Or `CityNights.digits(element, text, height)`; `CityNights.fare(23.4)` gives `" 23.40"`.

## The game provides
- The text: digits, `.`, `-` and spaces, padded with spaces to a fixed number of places (a space is an unlit 8). Fares have two decimals; the meter's fare has six places.
- A label beside it for screen readers (`cn-sr` text), since the digits are hidden from them.

## Rules
- Shapes, as the meter's canvas draws them: each place 0.52 × height wide and 0.68 × height apart; segments 0.12 × height thick; the whole slanted by 0.08 (skewX −4.6°); the point a square segment in the gap.
- Lit segments `digit-on` with a `digit-glow` 0.18 × height; unlit `digit-off`.
- Sizes in use: 44px (the desktop meter's fare), 30.8px (its time and speed), 30px (the title's best fare), 64px (the final fare), 18px (the high-score table). On the meter, sizes follow the picture: 40 and 28 picture pixels × the meter's scale.
- Right-align a column of fares.
