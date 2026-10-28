/* City Nights: the meter's seven-segment digits, built as HTML for previews and the interface.
   The same shapes the game's meter draws on its canvas: each place is 0.52 x height wide, segments 0.12 x height thick,
   places 0.68 x height apart, slanted 0.08, unlit segments always shown. */
window.CityNights = (function () {
  'use strict';
  var LIT = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', ' ': '' };
  function r1(v) { return Math.round(v * 10) / 10; }
  function box(s, h) {
    var w = h * 0.52, t = h * 0.12, h2 = h / 2;
    switch (s) {
      case 'a': return [t * 0.8, 0, w - t * 1.6, t];
      case 'b': return [w - t, t * 0.8, t, h2 - t * 1.2];
      case 'c': return [w - t, h2 + t * 0.4, t, h2 - t * 1.2];
      case 'd': return [t * 0.8, h - t, w - t * 1.6, t];
      case 'e': return [0, h2 + t * 0.4, t, h2 - t * 1.2];
      case 'f': return [0, t * 0.8, t, h2 - t * 1.2];
      default: return [t * 0.8, h2 - t / 2, w - t * 1.6, t];
    }
  }
  function seg(parent, q, on) {
    var el = document.createElement('i');
    el.className = on ? 'cn-seg is-on' : 'cn-seg';
    el.style.left = r1(q[0]) + 'px'; el.style.top = r1(q[1]) + 'px';
    el.style.width = r1(q[2]) + 'px'; el.style.height = r1(q[3]) + 'px';
    parent.appendChild(el);
  }
  // digits(el, text, height): fills el with the digits of text (0-9, '.', '-', ' ') at height px.
  // A space is an unlit place, so pad with spaces to keep a fixed width (the meter's fare is always 6 places).
  function digits(el, text, height) {
    var h = height || 30, t = h * 0.12, gap = h * 0.16, str = String(text);
    el.textContent = '';
    el.classList.add('cn-digits');
    el.setAttribute('aria-hidden', 'true');
    el.style.setProperty('--glow', r1(h * 0.18) + 'px');
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i), d = document.createElement('span');
      d.className = 'cn-digit';
      d.style.height = r1(h) + 'px';
      if (ch === '.') {
        d.style.width = r1(t + gap * 0.25) + 'px';
        seg(d, [-gap * 0.35, h - t, t, t], true);
      } else {
        d.style.width = r1(h * 0.52 + gap) + 'px';
        var lit = LIT[ch] || '';
        for (var k = 0; k < 7; k++) { var s = 'abcdefg'.charAt(k); seg(d, box(s, h), lit.indexOf(s) >= 0); }
      }
      el.appendChild(d);
    }
    return el;
  }
  // mountDigits(root): every element with data-cn-digits="text" and data-h="height" inside root.
  function mountDigits(root) {
    var list = (root || document).querySelectorAll('[data-cn-digits]');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      digits(el, el.getAttribute('data-cn-digits'), parseFloat(el.getAttribute('data-h')) || 30);
    }
  }
  // fare(n): a fare as the meter shows it, padded to 6 places (' 23.40'); as text it is 'HK$23.40'.
  function fare(n) { var s = Number(n).toFixed(2); while (s.length < 6) s = ' ' + s; return s; }
  return { digits: digits, mountDigits: mountDigits, fare: fare, version: '0.1.0' };
})();
