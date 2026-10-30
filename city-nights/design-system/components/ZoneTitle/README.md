# ZoneTitle

The zone change: when five fares finish a zone, the district caption grows into a big title in the middle of the dimmed street, like a film's chapter heading: the district just finished, then the next one and its round. The taxi's jump to the next district and the music's switch happen under it.

## When to use
- Grunge City Rider's Competitive mode, after the fifth fare of a zone (Barney, 30 October 2026: round 2b, C). Practice drives on through and has none.

## How it is drawn
Canvas 2D, by `CityNights.hud`, on a canvas over the picture (above the meter's):

```js
g.fillStyle = zoneShade; g.fillRect(0, 0, w, h);                              // the street dimmed, faded in and out
CityNights.hud.zoneTitle(g, w / 2, h * 0.45, k, m, { zh: '旺角', en: 'Mong Kok', done: true, take: '51.30' }, a);
CityNights.hud.zoneTitle(g, w / 2, h * 0.45, k, m, { zh: '尖沙咀', en: 'Tsim Sha Tsui', round: '3' }, a);
```

## The game provides
- The district finished and its takings (the fares and tips earned in it), the next district and its round, and the moment.

## Rules
- **Timing**, `zone-time` (3.4 s): 0.4 s in (the street dims to `zone-shade` as the caption grows from its place to the middle); 1 s on the finished district; 0.6 s across, while the street fades from the old place to the new and the title changes; 1 s on the next district; 0.4 s back to play (the title shrinks into the caption's place and the shade lifts). Under Reduce motion the title only fades.
- **Finished**: the district's Chinese (`zone-title-zh` at 76px) over its English (42px), then its five lamps, all lit, on their dark pill, and the takings, "HK$51.30" (34px).
- **Next**: the Chinese at 92px over the English at 48px, then 輪 ROUND n (30px).
- All in `caption` with a 6px `caption-outline` and a soft dark shadow, as the caption is, centred 45% down the picture. Sizes are for a 720-line window.
- **Safety**: the street dims gently and never goes black; nothing flashes.
- **Underneath**: the taxi's jump to just inside the next tunnel's exit, at the start of the next district (Tunnel; Barney, 30 October 2026), so the zone opens with the drive out into it; and, at every second zone change, the music's switch (the Sound section).
- **The game holds still** while it shows: the clock and the fare do not run. The next zone's clock starts at 50 s.
- Chinese: the districts and 輪 are on the word list.
