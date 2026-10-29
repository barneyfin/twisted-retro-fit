/* City Nights: the meter's seven-segment digits, built as HTML for previews and the interface,
   and the crash pop's drawings with the Canvas 2D code that draws them (further down).
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
  /* ---- Crash pop: the smoke cloud (Barney, 29 October 2026) ----
     crashPop holds the three drawings as layers: units are pixels on a 720-line window, the origin is the pop's centre,
     colours are token names. drawCrashPop draws one with Canvas 2D: no image files, the fonts must already be loaded
     (Bangers 400, Noto Sans TC 700). Draw each word once into its own canvas at the size needed and reuse it. */
  var POP = {"about":"City Nights crash pop, the smoke cloud (Barney, 29 October 2026). Units are pixels on a 720-line window; the origin is the pop's centre. Colours are token names.","box":[-540,-350,1080,700],"glow":[4,13],"words":{"crash":{"word":"CRASH!","layers":[{"k":"halo","cx":0,"cy":0,"rx":430,"ry":290,"color":"sodium","alpha":0.34},{"k":"smoke","d":"M-16 -190A83 83 0 0 1 124 -167A70 70 0 0 1 218 -136A69 69 0 0 1 283 -49A44 44 0 0 1 279 19A39 39 0 0 1 259 78A76 76 0 0 1 158 141A69 69 0 0 1 45 175A51 51 0 0 1 -45 170A108 108 0 0 1 -197 146A55 55 0 0 1 -266 84A37 37 0 0 1 -280 32A52 52 0 0 1 -262 -54A71 71 0 0 1 -199 -131A51 51 0 0 1 -140 -173A85 85 0 0 1 -16 -190 Z","grad":{"cx":1.5,"cy":-25.75,"rx":337.8,"ry":219}},{"k":"tube","color":"face-cream","core":"ink-white","width":8,"coreWidth":2,"paths":["M-16 -190A83 83 0 0 1 124 -167A70 70 0 0 1 218 -136A69 69 0 0 1 283 -49A44 44 0 0 1 279 19A39 39 0 0 1 259 78A76 76 0 0 1 158 141A69 69 0 0 1 45 175A51 51 0 0 1 -45 170A108 108 0 0 1 -197 146A55 55 0 0 1 -266 84A37 37 0 0 1 -280 32A52 52 0 0 1 -262 -54A71 71 0 0 1 -199 -131A51 51 0 0 1 -140 -173A85 85 0 0 1 -16 -190 Z"],"box":[-341,-283,360,286]},{"k":"tube","color":"face-cream","core":"ink-white","width":4,"coreWidth":1,"paths":["M-170 -110A40 40 0 0 1 -100 -128","M120 -140A44 44 0 0 1 190 -110","M-190 110A38 38 0 0 0 -128 138","M150 138A40 40 0 0 0 210 102"],"box":[-232,-188,254,182]},{"k":"smoke","d":"M-317 -106A22 22 0 0 1 -283 -98A17 17 0 0 1 -278 -76A15 15 0 0 1 -295 -55A19 19 0 0 1 -329 -54A22 22 0 0 1 -350 -75A14 14 0 0 1 -344 -97A17 17 0 0 1 -317 -106 ZM323 -120A28 28 0 0 1 362 -112A16 16 0 0 1 371 -85A16 16 0 0 1 348 -66A30 30 0 0 1 304 -66A24 24 0 0 1 279 -87A18 18 0 0 1 293 -108A24 24 0 0 1 323 -120 ZM-288 122A20 20 0 0 1 -259 136A15 15 0 0 1 -258 159A25 25 0 0 1 -290 168A20 20 0 0 1 -318 157A15 15 0 0 1 -319 133A20 20 0 0 1 -288 122 ZM290 154A24 24 0 0 1 322 164A16 16 0 0 1 325 187A15 15 0 0 1 303 203A16 16 0 0 1 276 202A16 16 0 0 1 256 185A14 14 0 0 1 260 165A23 23 0 0 1 290 154 ZM0 -248A24 24 0 0 1 33 -236A16 16 0 0 1 33 -212A25 25 0 0 1 0 -200A22 22 0 0 1 -33 -212A17 17 0 0 1 -30 -235A19 19 0 0 1 0 -248 Z","grad":{"cx":10.5,"cy":-45.05,"rx":432.6,"ry":270.6}},{"k":"tube","color":"face-cream","core":"ink-white","width":4,"coreWidth":1,"paths":["M-317 -106A22 22 0 0 1 -283 -98A17 17 0 0 1 -278 -76A15 15 0 0 1 -295 -55A19 19 0 0 1 -329 -54A22 22 0 0 1 -350 -75A14 14 0 0 1 -344 -97A17 17 0 0 1 -317 -106 ZM323 -120A28 28 0 0 1 362 -112A16 16 0 0 1 371 -85A16 16 0 0 1 348 -66A30 30 0 0 1 304 -66A24 24 0 0 1 279 -87A18 18 0 0 1 293 -108A24 24 0 0 1 323 -120 ZM-288 122A20 20 0 0 1 -259 136A15 15 0 0 1 -258 159A25 25 0 0 1 -290 168A20 20 0 0 1 -318 157A15 15 0 0 1 -319 133A20 20 0 0 1 -288 122 ZM290 154A24 24 0 0 1 322 164A16 16 0 0 1 325 187A15 15 0 0 1 303 203A16 16 0 0 1 276 202A16 16 0 0 1 256 185A14 14 0 0 1 260 165A23 23 0 0 1 290 154 ZM0 -248A24 24 0 0 1 33 -236A16 16 0 0 1 33 -212A25 25 0 0 1 0 -200A22 22 0 0 1 -33 -212A17 17 0 0 1 -30 -235A19 19 0 0 1 0 -248 Z"],"box":[-376,-276,394,223]},{"k":"tube","color":"tube-yellow","core":"tube-core-yellow","width":5,"coreWidth":2,"paths":["M350 -204 A50 50 0 1 0 450 -204 A50 50 0 1 0 350 -204 Z","M378 -204 A22 22 0 1 0 422 -204 A22 22 0 1 0 378 -204 Z","M394 -204 A6 6 0 1 0 406 -204 A6 6 0 1 0 394 -204 Z","M450 -204L460 -204","M443 -179L452 -174","M425 -161L430 -152","M400 -154L400 -144","M375 -161L370 -152","M357 -179L348 -174","M350 -204L340 -204","M357 -229L348 -234","M375 -247L370 -256","M400 -254L400 -264","M425 -247L430 -256","M443 -229L452 -234","M421 -197L442 -191","M400 -182L401 -160","M379 -197L358 -190","M387 -222L374 -239","M413 -222L425 -240"],"box":[295,-269,505,-139]},{"k":"tube","color":"face-cream","core":"ink-white","width":3,"coreWidth":1,"paths":["M338 -158L290 -126","M352 -136L308 -106","M328 -178L280 -152","M-400 -148L-350 -124","M-408 -114L-360 -96","M370 60L326 52","M374 88L330 84","M-378 110L-338 96","M-372 138L-334 130"],"box":[-411,-181,377,141]},{"k":"tube","color":"tube-teal","core":"tube-core-teal","width":5,"coreWidth":2,"paths":["M-454 -214L-433 -204L-466 -194L-427 -184L-460 -174L-421 -164L-454 -154L-415 -144L-448 -134L-409 -124L-442 -114L-403 -104"],"box":[-471,-219,-398,-99]},{"k":"tube","color":"tube-pink","core":"tube-core-pink","width":4,"coreWidth":1,"paths":["M435 80 L416 97 L391 90 L385 64 L404 47 L429 54 Z","M400 72 A10 10 0 1 0 420 72 A10 10 0 1 0 400 72 Z","M-382 112 L-395 130 L-417 128 L-426 108 L-413 90 L-391 92 Z","M-412 110 A8 8 0 1 0 -396 110 A8 8 0 1 0 -412 110 Z","M231 -254 L220 -248 L210 -254 L209 -266 L220 -272 L230 -266 Z","M215.5 -260 A4.5 4.5 0 1 0 224.5 -260 A4.5 4.5 0 1 0 215.5 -260 Z"],"box":[-430,-276,439,134]},{"k":"tube","color":"tube-teal","core":"tube-core-teal","width":5,"coreWidth":2,"paths":["M-430 218L-372 190","M-378 178L-364 204","M-414 211L-408 223M-400 204L-394 216M-386 197L-380 209"],"box":[-435,173,-359,228]},{"k":"tube","color":"tube-yellow","core":"tube-core-yellow","width":4,"coreWidth":1,"paths":["M-212 -276 L-210 -263 L-198 -260 L-209 -254 L-209 -242 L-218 -251 L-229 -246 L-224 -257 L-232 -267 L-219 -265 Z","M462 -70 L469 -58 L483 -60 L474 -49 L481 -36 L468 -42 L458 -32 L459 -46 L446 -52 L460 -56 Z","M-68 215 L-68 227 L-58 231 L-69 234 L-70 246 L-77 236 L-88 238 L-81 229 L-86 220 L-76 223 Z"],"box":[-236,-280,487,250]},{"k":"tag","x":240,"y":-160,"r":34,"ring":"tube-red","core":"tube-core-red","width":4,"coreWidth":1,"char":"轟","size":38,"baseline":13,"charStroke":1.2,"box":[202,-198,278,-122]},{"k":"letters","outline":18,"outlineColor":"case","depth":[9,11],"face":["pop-crash-light","tube-yellow","pop-crash-deep"],"faceStops":[0,0.5,1],"faceBox":[-0.883,0.181],"edge":"tube-red","edgeWidth":3,"edgeCore":"tube-core-red","edgeCoreWidth":1,"letters":[{"ch":"C","x":-223,"y":106,"rotate":-12,"size":184},{"ch":"R","x":-155,"y":95,"rotate":-12,"size":194},{"ch":"A","x":-77,"y":85,"rotate":-11,"size":204},{"ch":"S","x":2,"y":77,"rotate":-10,"size":214},{"ch":"H","x":85,"y":70,"rotate":-10,"size":226},{"ch":"!","x":175,"y":64,"rotate":-9,"size":238}],"box":[-263,-214,393.5,210.4]}]},"smash":{"word":"SMASH!","layers":[{"k":"halo","cx":0,"cy":0,"rx":430,"ry":290,"color":"sodium","alpha":0.34},{"k":"smoke","d":"M-6 -160A76 76 0 0 1 110 -168A90 90 0 0 1 228 -119A45 45 0 0 1 282 -58A46 46 0 0 1 313 13A47 47 0 0 1 288 81A63 63 0 0 1 205 134A47 47 0 0 1 127 154A95 95 0 0 1 -11 171A80 80 0 0 1 -128 168A52 52 0 0 1 -212 143A55 55 0 0 1 -292 89A60 60 0 0 1 -296 -3A40 40 0 0 1 -292 -69A45 45 0 0 1 -238 -112A66 66 0 0 1 -144 -160A84 84 0 0 1 -6 -160 Z","grad":{"cx":8.5,"cy":-15.45,"rx":365.4,"ry":203.4}},{"k":"tube","color":"face-cream","core":"ink-white","width":8,"coreWidth":2,"paths":["M-6 -160A76 76 0 0 1 110 -168A90 90 0 0 1 228 -119A45 45 0 0 1 282 -58A46 46 0 0 1 313 13A47 47 0 0 1 288 81A63 63 0 0 1 205 134A47 47 0 0 1 127 154A95 95 0 0 1 -11 171A80 80 0 0 1 -128 168A52 52 0 0 1 -212 143A55 55 0 0 1 -292 89A60 60 0 0 1 -296 -3A40 40 0 0 1 -292 -69A45 45 0 0 1 -238 -112A66 66 0 0 1 -144 -160A84 84 0 0 1 -6 -160 Z"],"box":[-364,-266,368,274]},{"k":"tube","color":"face-cream","core":"ink-white","width":4,"coreWidth":1,"paths":["M-188 -94A42 42 0 0 1 -114 -110","M136 -122A42 42 0 0 1 202 -92","M-170 120A36 36 0 0 0 -110 142","M130 142A38 38 0 0 0 192 114"],"box":[-234,-168,248,184]},{"k":"smoke","d":"M-335 -29A19 19 0 0 1 -309 -22A16 16 0 0 1 -299 1A17 17 0 0 1 -323 16A18 18 0 0 1 -351 15A18 18 0 0 1 -372 1A12 12 0 0 1 -365 -20A22 22 0 0 1 -335 -29 ZM343 -18A22 22 0 0 1 376 -8A16 16 0 0 1 387 17A21 21 0 0 1 364 35A23 23 0 0 1 331 35A20 20 0 0 1 304 17A15 15 0 0 1 313 -8A21 21 0 0 1 343 -18 ZM-220 -222A19 19 0 0 1 -194 -209A12 12 0 0 1 -194 -191A18 18 0 0 1 -218 -180A18 18 0 0 1 -246 -188A14 14 0 0 1 -246 -213A20 20 0 0 1 -220 -222 ZM229 177A18 18 0 0 1 258 187A16 16 0 0 1 259 210A21 21 0 0 1 231 222A20 20 0 0 1 199 213A17 17 0 0 1 198 190A23 23 0 0 1 229 177 Z","grad":{"cx":7.5,"cy":-22.2,"rx":455.4,"ry":266.4}},{"k":"tube","color":"face-cream","core":"ink-white","width":4,"coreWidth":1,"paths":["M-335 -29A19 19 0 0 1 -309 -22A16 16 0 0 1 -299 1A17 17 0 0 1 -323 16A18 18 0 0 1 -351 15A18 18 0 0 1 -372 1A12 12 0 0 1 -365 -20A22 22 0 0 1 -335 -29 ZM343 -18A22 22 0 0 1 376 -8A16 16 0 0 1 387 17A21 21 0 0 1 364 35A23 23 0 0 1 331 35A20 20 0 0 1 304 17A15 15 0 0 1 313 -8A21 21 0 0 1 343 -18 ZM-220 -222A19 19 0 0 1 -194 -209A12 12 0 0 1 -194 -191A18 18 0 0 1 -218 -180A18 18 0 0 1 -246 -188A14 14 0 0 1 -246 -213A20 20 0 0 1 -220 -222 ZM229 177A18 18 0 0 1 258 187A16 16 0 0 1 259 210A21 21 0 0 1 231 222A20 20 0 0 1 199 213A17 17 0 0 1 198 190A23 23 0 0 1 229 177 Z"],"box":[-394,-246,412,247]},{"k":"tube","color":"face-cream","core":"ink-white","width":3,"coreWidth":1,"paths":["M-234 -114L-249 -134L-271 -143L-304 -160","M233 -115L260 -122L272 -150L292 -160","M299 67L340 67L384 77L429 96","M-255 113L-293 139L-321 147L-349 152","M7 184L14 211L4 230L5 263","M-9 -172L-17 -207L-22 -244L-27 -261","M-317 22L-359 20L-386 15L-430 12"],"box":[-433,-264,432,266]},{"k":"tube","color":"face-cream","core":"ink-white","width":3,"coreWidth":1,"paths":["M320 -154L287 -138","M394 -27L358 -25","M352 137L318 124","M-331 -130L-298 -117","M-402 24L-366 21","M-312 164L-280 147","M107 -218L91 -186","M-105 -212L-89 -179","M282 218L253 196","M481 -151L447 -140"],"box":[-405,-221,484,221]},{"k":"tube","color":"tube-teal","core":"tube-core-teal","width":4,"coreWidth":1,"paths":["M414 -176 L341 -162 L360 -214 Z","M444 3 L397 -25 L469 -45 Z","M359 179 L389 132 L435 159 Z","M-359 -170 L-381 -116 L-417 -165 Z","M-426 50 L-466 24 L-445 1 Z","M-364 208 L-394 171 L-327 159 L-313 189 Z","M152 -245 L108 -231 L110 -271 Z","M-138 -231 L-121 -261 L-93 -232 Z","M321 259 L294 248 L290 220 L334 234 Z","M514 -149 L494 -172 L524 -170 Z"],"box":[-470,-275,528,263]},{"k":"tube","color":"tube-yellow","core":"tube-core-yellow","width":5,"coreWidth":2,"paths":["M-472 -210 A40 40 0 1 0 -392 -210 A40 40 0 1 0 -472 -210 Z","M-459 -210 A27 27 0 1 0 -405 -210 A27 27 0 1 0 -459 -210 Z","M-444 -242L-428 -214L-442 -196L-426 -172","M-428 -214L-398 -218"],"box":[-517,-255,-347,-165]},{"k":"tube","color":"ink-white","core":"ink-white","width":2.5,"coreWidth":1,"paths":["M506 -174L506 -146M492 -160L520 -160M500 -166L512 -154M500 -154L512 -166","M-340 78L-340 102M-352 90L-328 90M-345 85L-335 95M-345 95L-335 85","M0 227L0 253M-13 240L13 240M-6 234L6 246M-6 246L6 234","M370 -281L370 -259M359 -270L381 -270M365 -275L375 -265M365 -265L375 -275","M-490 -90L-490 -70M-500 -80L-480 -80M-494 -84L-486 -76M-494 -76L-486 -84"],"box":[-502.5,-283.5,522.5,255.5]},{"k":"tag","x":-240,"y":-148,"r":34,"ring":"tube-yellow","core":"tube-core-yellow","width":4,"coreWidth":1,"char":"啪","size":38,"baseline":13,"charStroke":1.2,"box":[-278,-186,-202,-110]},{"k":"letters","outline":18,"outlineColor":"case","depth":[9,11],"face":["pop-smash-light","tube-red","pop-smash-deep"],"faceStops":[0,0.35,1],"faceBox":[-0.883,0.181],"edge":"tube-yellow","edgeWidth":3,"edgeCore":"tube-core-yellow","edgeCoreWidth":1,"letters":[{"ch":"S","x":-235,"y":108,"rotate":-11,"size":178},{"ch":"M","x":-166,"y":98,"rotate":-10,"size":188},{"ch":"A","x":-62,"y":89,"rotate":-10,"size":198},{"ch":"S","x":15,"y":81,"rotate":-9,"size":208},{"ch":"H","x":96,"y":75,"rotate":-9,"size":220},{"ch":"!","x":183,"y":70,"rotate":-8,"size":236}],"box":[-275,-206,400,210.3]}]},"bang":{"word":"BANG!","layers":[{"k":"halo","cx":0,"cy":0,"rx":440,"ry":300,"color":"sodium","alpha":0.34},{"k":"fill","color":"tube-red","alpha":0.16,"paths":["M-219 -103Q-308 -133 -410 -131Q-329 -83 -243 -46","M-71 -187Q-107 -248 -177 -294Q-163 -222 -137 -156","M124 -163Q159 -231 160 -312Q103 -253 57 -188","M239 -55Q325 -85 395 -147Q301 -136 211 -113","M223 93Q314 118 418 110Q334 62 247 25","M94 173Q128 219 192 247Q179 190 155 138","M-162 133Q-211 186 -229 259Q-165 216 -111 167","M-248 20Q-321 34 -384 82Q-306 86 -231 78"]},{"k":"tube","color":"tube-red","core":"tube-core-red","width":6,"coreWidth":2,"paths":["M-219 -103Q-308 -133 -410 -131Q-329 -83 -243 -46","M-71 -187Q-107 -248 -177 -294Q-163 -222 -137 -156","M124 -163Q159 -231 160 -312Q103 -253 57 -188","M239 -55Q325 -85 395 -147Q301 -136 211 -113","M223 93Q314 118 418 110Q334 62 247 25","M94 173Q128 219 192 247Q179 190 155 138","M-162 133Q-211 186 -229 259Q-165 216 -111 167","M-248 20Q-321 34 -384 82Q-306 86 -231 78"],"box":[-416,-318,424,265]},{"k":"tube","color":"tube-yellow","core":"tube-core-yellow","width":4,"coreWidth":1,"paths":["M-225 -88Q-283 -101 -342 -109Q-288 -88 -237 -60","M-87 -179Q-118 -214 -149 -247Q-130 -208 -121 -164","M107 -169Q121 -214 133 -260Q108 -219 74 -182","M232 -70Q282 -95 331 -123Q276 -107 218 -99","M229 76Q288 84 348 91Q293 71 241 42","M109 164Q137 189 167 212Q149 182 140 147","M-150 142Q-174 178 -194 217Q-162 186 -124 158","M-244 34Q-287 50 -329 70Q-283 63 -235 63"],"box":[-346,-264,352,221]},{"k":"tube","color":"tube-yellow","core":"tube-core-yellow","width":4,"coreWidth":1,"paths":["M-349 -156A420 280 0 0 1 -155 -260","M204 -267A450 300 0 0 1 384 -157","M367 151A430 288 0 0 1 214 250","M-206 263A446 296 0 0 1 -382 153"],"dash":[26,14],"box":[-832,-571,838,563]},{"k":"halo","cx":0,"cy":0,"rx":430,"ry":290,"color":"sodium","alpha":0.34},{"k":"smoke","d":"M-11 -201A71 71 0 0 1 109 -195A77 77 0 0 1 205 -134A73 73 0 0 1 262 -34A63 63 0 0 1 266 56A54 54 0 0 1 213 122A80 80 0 0 1 111 171A96 96 0 0 1 -21 189A85 85 0 0 1 -142 176A48 48 0 0 1 -190 125A82 82 0 0 1 -275 43A53 53 0 0 1 -270 -38A60 60 0 0 1 -223 -129A98 98 0 0 1 -104 -194A59 59 0 0 1 -11 -201 Z","grad":{"cx":-4.5,"cy":-25.5,"rx":324.6,"ry":234}},{"k":"tube","color":"face-cream","core":"ink-white","width":8,"coreWidth":2,"paths":["M-11 -201A71 71 0 0 1 109 -195A77 77 0 0 1 205 -134A73 73 0 0 1 262 -34A63 63 0 0 1 266 56A54 54 0 0 1 213 122A80 80 0 0 1 111 171A96 96 0 0 1 -21 189A85 85 0 0 1 -142 176A48 48 0 0 1 -190 125A82 82 0 0 1 -275 43A53 53 0 0 1 -270 -38A60 60 0 0 1 -223 -129A98 98 0 0 1 -104 -194A59 59 0 0 1 -11 -201 Z"],"box":[-365,-300,343,293]},{"k":"tube","color":"face-cream","core":"ink-white","width":4,"coreWidth":1,"paths":["M-154 -120A40 40 0 0 1 -84 -140","M108 -144A44 44 0 0 1 176 -114","M-174 110A38 38 0 0 0 -112 136","M132 130A40 40 0 0 0 192 96"],"box":[-216,-192,236,178]},{"k":"smoke","d":"M-287 -135A22 22 0 0 1 -258 -122A15 15 0 0 1 -260 -97A22 22 0 0 1 -289 -86A17 17 0 0 1 -316 -100A13 13 0 0 1 -320 -121A22 22 0 0 1 -287 -135 ZM306 126A19 19 0 0 1 335 134A16 16 0 0 1 341 157A16 16 0 0 1 321 173A23 23 0 0 1 287 175A22 22 0 0 1 264 154A12 12 0 0 1 269 135A22 22 0 0 1 306 126 ZM-312 125A21 21 0 0 1 -283 134A15 15 0 0 1 -275 157A15 15 0 0 1 -294 170A23 23 0 0 1 -328 172A17 17 0 0 1 -345 155A11 11 0 0 1 -337 136A16 16 0 0 1 -312 125 Z","grad":{"cx":-2,"cy":4.5,"rx":411.6,"ry":186}},{"k":"tube","color":"face-cream","core":"ink-white","width":4,"coreWidth":1,"paths":["M-287 -135A22 22 0 0 1 -258 -122A15 15 0 0 1 -260 -97A22 22 0 0 1 -289 -86A17 17 0 0 1 -316 -100A13 13 0 0 1 -320 -121A22 22 0 0 1 -287 -135 ZM306 126A19 19 0 0 1 335 134A16 16 0 0 1 341 157A16 16 0 0 1 321 173A23 23 0 0 1 287 175A22 22 0 0 1 264 154A12 12 0 0 1 269 135A22 22 0 0 1 306 126 ZM-312 125A21 21 0 0 1 -283 134A15 15 0 0 1 -275 157A15 15 0 0 1 -294 170A23 23 0 0 1 -328 172A17 17 0 0 1 -345 155A11 11 0 0 1 -337 136A16 16 0 0 1 -312 125 Z"],"box":[-366,-161,361,202]},{"k":"tube","color":"tube-teal","core":"tube-core-teal","width":5,"coreWidth":2,"paths":["M370 150 A42 42 0 1 0 454 150 A42 42 0 1 0 370 150 Z","M400 150 A12 12 0 1 0 424 150 A12 12 0 1 0 400 150 Z","M425 155L447 165","M414 164L417 188","M401 158L382 173","M399 145L377 135","M410 136L407 112","M423 142L442 127"],"box":[323,103,501,197]},{"k":"tube","color":"face-cream","core":"ink-white","width":3,"coreWidth":1,"paths":["M360 180L320 190","M364 202L326 210","M356 158L318 166"],"box":[315,155,367,213]},{"k":"tube","color":"tube-pink","core":"tube-core-pink","width":4,"coreWidth":1,"paths":["M438 28L479 31","M400 133L448 149","M274 228L299 248","M135 287L151 322","M-73 299L-79 323","M-302 218L-329 237","M-368 152L-412 170","M-440 19L-483 21","M-401 -128L-431 -138","M-255 -234L-276 -254","M-81 -289L-87 -311","M98 -294L105 -314","M286 -228L306 -244","M386 -123L426 -135"],"box":[-487,-318,483,327]},{"k":"tube","color":"tube-pink","core":"tube-core-pink","width":4,"coreWidth":1,"paths":["M-406 -106 L-420 -91 L-439 -95 L-446 -114 L-432 -129 L-413 -125 Z","M-433 -110 A7 7 0 1 0 -419 -110 A7 7 0 1 0 -433 -110 Z","M459 -151 L445 -144 L432 -153 L433 -169 L447 -176 L460 -167 Z","M440 -160 A6 6 0 1 0 452 -160 A6 6 0 1 0 440 -160 Z"],"box":[-450,-180,464,-87]},{"k":"tube","color":"ink-white","core":"ink-white","width":2.5,"coreWidth":1,"paths":["M-380 26L-380 54M-394 40L-366 40M-386 34L-374 46M-386 46L-374 34","M480 -3L480 23M467 10L493 10M474 4L486 16M474 16L486 4","M0 -302L0 -278M-12 -290L12 -290M-5 -295L5 -285M-5 -285L5 -295"],"box":[-396.5,-304.5,495.5,56.5]},{"k":"tag","x":220,"y":-174,"r":34,"ring":"tube-teal","core":"tube-core-teal","width":4,"coreWidth":1,"char":"砰","size":38,"baseline":13,"charStroke":1.2,"box":[182,-212,258,-136]},{"k":"letters","outline":18,"outlineColor":"case","depth":[9,11],"face":["pop-bang-light","tube-pink","pop-bang-deep"],"faceStops":[0,0.4,1],"faceBox":[-0.883,0.181],"edge":"tube-teal","edgeWidth":3,"edgeCore":"tube-core-teal","edgeCoreWidth":1,"letters":[{"ch":"B","x":-204,"y":103,"rotate":-12,"size":200},{"ch":"A","x":-127,"y":91,"rotate":-11,"size":212},{"ch":"N","x":-45,"y":81,"rotate":-11,"size":224},{"ch":"G","x":47,"y":73,"rotate":-10,"size":236},{"ch":"!","x":153,"y":66,"rotate":-9,"size":252}],"box":[-244,-226,382,213]}]}}};
  var popCols = {};
  function popCol(name) {
    if (name.charAt(0) === '#' || name.indexOf('rgb') === 0) return name;
    if (!popCols[name]) popCols[name] = getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim();
    return popCols[name];
  }
  function popAlpha(c, a) {
    if (c.charAt(0) !== '#') return c;
    var n = parseInt(c.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  var popScratch = null;
  // The neon glow: what draw() paints is copied back with two soft blurs (std. dev. glow[1], then glow[0]) and then sharp.
  // Only the layer's box (plus room for the blur) is copied, which keeps the cost down.
  function popGlow(ctx, scale, color, box, draw) {
    var c = ctx.canvas, m = ctx.getTransform(), pad = Math.ceil(3 * POP.glow[1] * scale) + 2;
    var xs = [], ys = [], k, px, py;
    for (k = 0; k < 4; k++) {
      px = k & 1 ? box[2] : box[0]; py = k & 2 ? box[3] : box[1];
      xs.push(m.a * px + m.c * py + m.e); ys.push(m.b * px + m.d * py + m.f);
    }
    var x0 = Math.max(0, Math.floor(Math.min.apply(null, xs)) - pad), y0 = Math.max(0, Math.floor(Math.min.apply(null, ys)) - pad);
    var x1 = Math.min(c.width, Math.ceil(Math.max.apply(null, xs)) + pad), y1 = Math.min(c.height, Math.ceil(Math.max.apply(null, ys)) + pad);
    if (x1 <= x0 || y1 <= y0) return;
    if (!popScratch) popScratch = document.createElement('canvas');
    if (popScratch.width < c.width || popScratch.height < c.height) { popScratch.width = c.width; popScratch.height = c.height; }
    var l = popScratch.getContext('2d'), w = x1 - x0, h = y1 - y0;
    l.setTransform(1, 0, 0, 1, 0, 0); l.clearRect(x0, y0, w, h);
    l.setTransform(m);
    draw(l);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.shadowColor = color;
    ctx.shadowBlur = 2 * POP.glow[1] * scale; ctx.drawImage(popScratch, x0, y0, w, h, x0, y0, w, h);
    ctx.shadowBlur = 2 * POP.glow[0] * scale; ctx.drawImage(popScratch, x0, y0, w, h, x0, y0, w, h);
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.drawImage(popScratch, x0, y0, w, h, x0, y0, w, h);
    ctx.restore();
  }
  function popStroke(g, paths, color, width, dash) {
    g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash(dash || []);
    for (var i = 0; i < paths.length; i++) g.stroke(paths[i]);
    g.setLineDash([]);
  }
  function popPaths(list) { return list.map(function (d) { return new Path2D(d); }); }

  // drawCrashPop(ctx, word, x, y, scale): draws 'crash', 'smash' or 'bang' with its centre at x, y (canvas pixels)
  // at scale (canvas pixels per 720-line pixel). Its box is POP.box around the centre.
  function drawCrashPop(ctx, word, x, y, scale) {
    var W = POP.words[word];
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    W.layers.forEach(function (L) {
      var grad, p;
      if (L.k === 'halo') {
        ctx.save(); ctx.translate(L.cx, L.cy); ctx.scale(L.rx, L.ry);
        grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        grad.addColorStop(0, popAlpha(popCol(L.color), L.alpha)); grad.addColorStop(1, popAlpha(popCol(L.color), 0));
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      } else if (L.k === 'smoke') {
        p = new Path2D(L.d);
        ctx.fillStyle = popCol('neon-board'); ctx.fill(p);
        ctx.save(); ctx.clip(p); ctx.translate(L.grad.cx, L.grad.cy); ctx.scale(L.grad.rx, L.grad.ry);
        grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        grad.addColorStop(0, popAlpha(popCol('face-cream'), 0.30)); grad.addColorStop(1, popAlpha(popCol('sodium'), 0.10));
        ctx.fillStyle = grad; ctx.fillRect(-3, -3, 6, 6); ctx.restore();
      } else if (L.k === 'fill') {
        ctx.fillStyle = popAlpha(popCol(L.color), L.alpha);
        popPaths(L.paths).forEach(function (q) { ctx.fill(q); });
      } else if (L.k === 'tube') {
        p = popPaths(L.paths);
        popGlow(ctx, scale, popCol(L.color), L.box, function (g) { popStroke(g, p, popCol(L.color), L.width, L.dash); });
        popStroke(ctx, p, popCol(L.core), L.coreWidth, L.dash);
      } else if (L.k === 'tag') {
        p = [new Path2D('M' + (L.x - L.r) + ' ' + L.y + ' A' + L.r + ' ' + L.r + ' 0 1 0 ' + (L.x + L.r) + ' ' + L.y + ' A' + L.r + ' ' + L.r + ' 0 1 0 ' + (L.x - L.r) + ' ' + L.y + ' Z')];
        ctx.fillStyle = popCol('neon-board'); ctx.fill(p[0]);
        popGlow(ctx, scale, popCol(L.ring), L.box, function (g) { popStroke(g, p, popCol(L.ring), L.width); });
        popStroke(ctx, p, popCol(L.core), L.coreWidth);
        popGlow(ctx, scale, popCol(L.core), L.box, function (g) {
          g.font = '700 ' + L.size + 'px "Noto Sans TC", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
          g.fillStyle = popCol(L.core); g.fillText(L.char, L.x, L.y + L.baseline);
          g.strokeStyle = popCol(L.ring); g.lineWidth = L.charStroke; g.lineJoin = 'round'; g.strokeText(L.char, L.x, L.y + L.baseline);
        });
      } else if (L.k === 'letters') {
        var each = function (g, fn) {
          L.letters.forEach(function (t) {
            g.save(); g.translate(t.x, t.y); g.rotate(t.rotate * Math.PI / 180);
            g.font = t.size + 'px Bangers, Impact, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
            fn(g, t); g.restore();
          });
        };
        var ink = popCol(L.outlineColor);
        // the dark extrusion, then the black comic outline
        each(ctx, function (g, t) {
          g.fillStyle = ink; g.strokeStyle = ink; g.lineWidth = L.outline; g.lineJoin = 'round';
          g.fillText(t.ch, L.depth[0], L.depth[1]); g.strokeText(t.ch, L.depth[0], L.depth[1]);
        });
        each(ctx, function (g, t) {
          g.fillStyle = ink; g.strokeStyle = ink; g.lineWidth = L.outline; g.lineJoin = 'round';
          g.fillText(t.ch, 0, 0); g.strokeText(t.ch, 0, 0);
        });
        // the lit face, light at the top of each letter's box (font ascent) to deep at its foot (descent)
        each(ctx, function (g, t) {
          var lg = g.createLinearGradient(0, L.faceBox[0] * t.size, 0, L.faceBox[1] * t.size);
          for (var i = 0; i < L.face.length; i++) lg.addColorStop(L.faceStops[i], popCol(L.face[i]));
          g.fillStyle = lg; g.fillText(t.ch, 0, 0);
        });
        // a thin glowing tube round each letter, with its core
        popGlow(ctx, scale, popCol(L.edge), L.box, function (g) {
          each(g, function (h, t) { h.strokeStyle = popCol(L.edge); h.lineWidth = L.edgeWidth; h.lineJoin = 'round'; h.strokeText(t.ch, 0, 0); });
        });
        each(ctx, function (g, t) { g.strokeStyle = popCol(L.edgeCore); g.lineWidth = L.edgeCoreWidth; g.lineJoin = 'round'; g.strokeText(t.ch, 0, 0); });
      }
    });
    ctx.restore();
  }

  return { digits: digits, mountDigits: mountDigits, fare: fare, crashPop: POP, drawCrashPop: drawCrashPop, version: '0.2.0' };
})();
