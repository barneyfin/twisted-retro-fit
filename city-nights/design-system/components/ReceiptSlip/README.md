# ReceiptSlip

A paper slip printed out of the top of the meter, like a real taxi meter's receipt: the one message during play. It says what a fare paid, or what happened to the tip.

## When to use
- Grunge City Rider (Barney, 30 October 2026: round 2, B): when a fare is paid at the drop-off, when the tip halves (a crash, or an animal hit or near miss, with a passenger aboard) and when the tip is lost (driving past the drop-off).
- Nothing else prints. The zone change has its own title (ZoneTitle).

## How it is drawn
Canvas 2D, by `CityNights.hud`, on the meter's canvas:

```js
CityNights.hud.receipt(g, x, meterTop - 4 * k, k, m, {
  head: 'RECEIPT',
  lines: [['車資', 'FARE', '9.20'], ['小費', 'TIP', '0.46'], ['錢', '+20%', '1.84'], ['', '', 'HK$ 11.50', 'total']]
}, show);
```
- `x`: 24 (720-line pixels) right of the meter's left edge; it stands on the meter's case, 4 below its top edge. `show` is how far it is out (0 to 1).
- A line is `[Chinese, English, amount, style]`: style `'total'` (a dashed rule above, larger), `'red'` (`receipt-red`), `'struck'` (red, with a line through).

## The game provides
- The lines: for a fare, the trip's fare (already on the meter), the tip, any fare boost (錢 +20% or 雙 +100%) and the total; for a halved tip, the tip before and after; for a lost tip, what it was.

## Rules
- **Look**: `receipt-paper`, 210 wide on a 720-line window, a torn zigzag top edge, a soft shadow; printed in `receipt-ink`: 的士 (Noto Serif TC Black) and RECEIPT or TIP at the top, then the lines (`receipt-zh`, `receipt-en`, `receipt-value`), the total larger. On phones no letter smaller than 9 CSS pixels (labels), 11 (amounts) or 12 (total).
- **Timing**: `receipt-time`: it prints up out of the meter over 0.25 s, holds 2 s and goes back in over 0.25 s. The caption fades out while it shows and back after. Under Reduce motion it fades in and out where it stands.
- One at a time; a new one replaces the one showing.
- The fare on the meter counts up by what the slip adds (the tip and any boost).
- Chinese: 的士, 車資, 小費, 錢 and 雙 are on the word list.
