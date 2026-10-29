/* City Nights: the meter's seven-segment digits, built as HTML for previews and the interface,
   the crash pop's drawings with the Canvas 2D code that draws them, and the street's pieces (obstacles, animals,
   passengers, the stop bay) as Canvas 2D drawing code (further down).
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

  /* ---- The street's pieces: obstacles, animals, passengers and the stop zone (Barney, 29 October 2026) ----
     Two kinds of drawing, both Canvas 2D with colours by token name:
     - pictures made once: the animals, the crate and the passengers (upright, drawn at ppm pixels per metre, with the
       point on the ground they stand on), and the road pictures (oil, pothole, the stop bay, the pool of light), whose top
       edge is the far end;
     - things with depth drawn in the street's own perspective: roadworks, cones and spilt cargo, through pt(d, x, y),
       which the game supplies: d metres ahead, x metres across from the road's centre, y metres up -> { x, y, s }
       in canvas pixels, s being pixels per metre there (null if it is out of sight).
     All true size (Barney, 29 October 2026). */
  var street = (function () {
    var PPM = 160;   // animal pictures: pixels per metre (their shapes are drawn in centimetres, 100 to the metre)
    var col = popCol, rgba = popAlpha;
    function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
    // a token colour lightened (k > 0, towards white) or darkened (k < 0, towards black): faces of a box lit from above
    function shade(name, k) {
      var c = col(name), n = parseInt(c.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
      var f = function (v) { return Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)); };
      return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
    }
    function rnd(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
    function blurred(src, px) { var c = mk(src.width, src.height), g = c.getContext('2d'); g.filter = 'blur(' + px + 'px)'; g.drawImage(src, 0, 0); return c; }
    function poly(g, pts) { g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); g.closePath(); }

    /* ---------- placing things in the street ---------- */
    // an upright picture standing at (d, x), facing the camera
    function stand(g, pt, spr, d, x, alpha) {
      var p = pt(d, x, 0); if (!p) return null;
      var k = p.s / spr.ppm;
      g.save(); if (alpha != null) g.globalAlpha = alpha;
      g.drawImage(spr.c, p.x - spr.ax * k, p.y - spr.ay * k, spr.c.width * k, spr.c.height * k); g.restore();
      return p;
    }
    // a picture lying flat on the road from d0 (near) to d1 (far), x0 to x1 across; drawn row by row so the perspective is true
    function decal(g, pt, tex, d0, d1, x0, x1, alpha, blend) {
      // rows meet on whole device pixels, so nothing is drawn twice (which would show as stripes in a blended glow)
      var rows = 160, m = g.getTransform(), ky = m.d || 1, oy = m.f || 0, snap = function (y) { return (Math.round(y * ky + oy) - oy) / ky; };
      g.save(); g.globalAlpha = alpha == null ? 1 : alpha; if (blend) g.globalCompositeOperation = blend;
      var start = 0, top = null;
      for (var i = 0; i < rows; i++) {
        var t0 = start / rows, t1 = (i + 1) / rows, da = d1 - (d1 - d0) * t0, db = d1 - (d1 - d0) * t1;
        var pa = pt(da, x0, 0), pb = pt(db, x0, 0), qa = pt(da, x1, 0), qb = pt(db, x1, 0);
        if (!pa || !pb || !qa || !qb) { start = i + 1; continue; }
        var y0 = snap(pa.y), y1 = snap(pb.y);
        if (y1 <= y0) continue;                                   // too thin yet: carry this row into the next
        var xa = (pa.x + pb.x) / 2, xb = (qa.x + qb.x) / 2;
        g.drawImage(tex, 0, tex.height * t0, tex.width, Math.max(1, tex.height * (t1 - t0)), xa, y0, xb - xa, y1 - y0);
        start = i + 1;
      }
      g.restore();
    }
    // a soft contact shadow under something w wide and l long, its near edge at d
    function shadow(g, pt, d, x, w, l, a) {
      for (var k = 3; k >= 1; k--) {
        var m = 0.06 * k, pts = [];
        for (var i = 0; i < 24; i++) { var t = i / 24 * Math.PI * 2, p = pt(d + l / 2 + Math.sin(t) * (l / 2 + m), x + Math.cos(t) * (w / 2 + m), 0); if (!p) return; pts.push(p); }
        poly(g, pts); g.fillStyle = rgba(col('case'), (a || 0.3) * 0.33); g.fill();
      }
    }
    // a box: front, the side facing the camera, and the top, lit warm from above. faces = [top, front, side] colours.
    function box(g, pt, d, x, w, l, h, faces, o) {
      o = o || {};
      var x0 = x - w / 2, x1 = x + w / 2, d1 = d + l, cx = o.camX || 0;
      var top = [pt(d, x0, h), pt(d, x1, h), pt(d1, x1, h), pt(d1, x0, h)], front = [pt(d, x0, 0), pt(d, x1, 0), pt(d, x1, h), pt(d, x0, h)];
      if (top.concat(front).some(function (p) { return !p; })) return null;
      if (x0 > cx) { poly(g, [pt(d, x0, 0), pt(d1, x0, 0), pt(d1, x0, h), pt(d, x0, h)]); g.fillStyle = faces[2]; g.fill(); }
      if (x1 < cx) { poly(g, [pt(d, x1, 0), pt(d1, x1, 0), pt(d1, x1, h), pt(d, x1, h)]); g.fillStyle = faces[2]; g.fill(); }
      poly(g, front); g.fillStyle = faces[1]; g.fill(); if (o.front) o.front(front);
      poly(g, top); g.fillStyle = faces[0]; g.fill(); if (o.top) o.top(top);
      return { top: top, front: front };
    }

    /* ---------- ANIMALS: dark shapes lit warm by the shops behind, with the taxi's headlights caught in their eyes.
       Side-on, crossing, head turned to the taxi. run = the bolting stride. They always escape. ---------- */
    function silhouette(w, h, draw, eyes, anchor) {
      var pad = 20, sil = mk(w + pad * 2, h + pad * 2), sg = sil.getContext('2d');
      sg.translate(pad, pad); sg.fillStyle = '#000'; sg.strokeStyle = '#000'; sg.lineCap = 'round'; sg.lineJoin = 'round';
      sg.save(); sg.scale(PPM / 100, PPM / 100); draw(sg); sg.restore();
      var out = mk(sil.width, sil.height), g = out.getContext('2d');
      var tint = function (c) { var t = mk(sil.width, sil.height), tg = t.getContext('2d'); tg.drawImage(sil, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = c; tg.fillRect(0, 0, t.width, t.height); return t; };
      g.globalAlpha = 0.85; g.drawImage(tint(col('figure-rim')), 2, -3);      // rim light from the shops behind and above
      g.globalAlpha = 1; g.drawImage(tint(col('animal-dark')), 0, 0);
      var lit = tint(col('animal-lit')), lg = lit.getContext('2d');           // the taxi's lamps lifting the lower side
      lg.globalCompositeOperation = 'destination-in';
      var gr = lg.createLinearGradient(0, 0, 0, lit.height); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.75)'); lg.fillStyle = gr; lg.fillRect(0, 0, lit.width, lit.height);
      g.drawImage(lit, 0, 0);
      g.save(); g.translate(pad, pad); g.scale(PPM / 100, PPM / 100); eyes(g); g.restore();
      return { c: out, ppm: PPM, ax: pad + anchor[0] * PPM / 100, ay: pad + anchor[1] * PPM / 100 };
    }
    // eyeshine: steady, never flashing
    function eyes(g, pts, r, token) {
      var c = col(token);
      pts.forEach(function (p) {
        var R = r * 9, gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], R);
        gr.addColorStop(0, rgba(c, 1)); gr.addColorStop(0.2, rgba(c, 0.55)); gr.addColorStop(1, rgba(c, 0));
        g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(p[0] - R, p[1] - R, R * 2, R * 2);
        g.globalCompositeOperation = 'source-over'; g.fillStyle = col('ink-white'); g.beginPath(); g.arc(p[0], p[1], r * 1.5, 0, Math.PI * 2); g.fill();
      });
    }
    function leg(g, x0, y0, x1, y1, w0, w1) {
      var a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a);
      g.beginPath(); g.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); g.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); g.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2); g.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); g.closePath(); g.fill();
      g.beginPath(); g.arc(x1, y1, w1 / 2, 0, Math.PI * 2); g.fill();
    }
    // Wild boar: 1.4 m long, 0.9 m at the shoulder; bristly ridge, long snout, small tusks. Amber eyeshine.
    function boar(run) {
      return silhouette(1.85 * PPM, 1.15 * PPM, function (g) {
        g.beginPath(); g.moveTo(20, 52); g.bezierCurveTo(18, 30, 38, 20, 62, 18); g.bezierCurveTo(84, 14, 104, 10, 116, 22);
        g.bezierCurveTo(124, 30, 126, 44, 124, 58); g.bezierCurveTo(118, 70, 96, 72, 70, 70); g.bezierCurveTo(46, 70, 26, 68, 20, 52); g.fill();
        g.lineWidth = 2.2; for (var i = 0; i < 16; i++) { var x = 42 + i * 5, y = 17 - Math.sin(i / 15 * Math.PI) * 4; g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x + 1.5, y - 4 - (i % 3)); g.stroke(); }
        g.beginPath(); g.moveTo(112, 22); g.bezierCurveTo(124, 18, 136, 28, 142, 40); g.lineTo(150, 52); g.bezierCurveTo(152, 58, 146, 62, 138, 60); g.bezierCurveTo(128, 58, 120, 56, 114, 50); g.closePath(); g.fill();
        g.beginPath(); g.ellipse(149, 55, 4.5, 6, 0.2, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.moveTo(118, 22); g.lineTo(122, 8); g.lineTo(128, 22); g.fill();
        g.beginPath(); g.moveTo(126, 25); g.lineTo(134, 13); g.lineTo(136, 28); g.fill();
        var legs = run ? [[34, 64, 14, 88], [48, 64, 58, 90], [100, 64, 82, 90], [114, 62, 138, 84]] : [[34, 64, 32, 92], [50, 66, 52, 92], [100, 66, 98, 92], [114, 64, 118, 92]];
        legs.forEach(function (q) { leg(g, q[0], q[1], q[2], q[3], 12, 6); });
        g.lineWidth = 2; g.beginPath(); g.moveTo(21, 40); g.quadraticCurveTo(10, 44, 12, 56); g.stroke();
      }, function (g) {
        g.fillStyle = col('chicken-light'); g.beginPath(); g.moveTo(139, 59); g.quadraticCurveTo(136, 52, 132, 50); g.lineTo(136, 58); g.fill();   // tusk
        eyes(g, [[131, 37], [138, 38]], 1.6, 'eyeshine-amber');
      }, [82, 92]);
    }
    // Stray dog: a Hong Kong village dog, 1 m long, 0.6 m tall; long muzzle, pricked ears, tail curled over the back.
    function dog(run) {
      return silhouette(1.2 * PPM, 0.8 * PPM, function (g) {
        g.beginPath(); g.moveTo(16, 30); g.bezierCurveTo(18, 22, 40, 22, 60, 21); g.bezierCurveTo(74, 20, 82, 22, 86, 30);
        g.bezierCurveTo(88, 40, 82, 48, 72, 48); g.bezierCurveTo(56, 46, 40, 42, 26, 42); g.bezierCurveTo(18, 41, 15, 37, 16, 30); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(74, 24); g.bezierCurveTo(78, 14, 84, 8, 92, 8); g.bezierCurveTo(98, 8, 101, 11, 104, 15);
        g.lineTo(116, 19); g.bezierCurveTo(119, 21, 118, 25, 114, 26); g.lineTo(100, 27); g.bezierCurveTo(94, 30, 88, 34, 86, 38); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(86, 10); g.lineTo(84, -3); g.lineTo(92, 7); g.fill();
        g.beginPath(); g.moveTo(92, 8); g.lineTo(94, -4); g.lineTo(99, 10); g.fill();
        var legs = run ? [[24, 38, 4, 58], [34, 40, 44, 64], [72, 40, 56, 64], [80, 40, 102, 56]] : [[22, 38, 21, 70], [32, 40, 34, 70], [72, 42, 71, 70], [80, 42, 84, 70]];
        legs.forEach(function (q) { leg(g, q[0], q[1], q[2], q[3], 9, 6); });
        g.lineWidth = 7; g.beginPath(); g.moveTo(18, 28); g.bezierCurveTo(6, 22, 8, 6, 20, 8); g.bezierCurveTo(28, 10, 28, 18, 22, 20); g.stroke();
      }, function (g) { eyes(g, [[94, 14], [100, 15]], 1.3, 'eyeshine-gold'); }, [58, 70]);
    }
    // Street cat: 0.5 m long, low and slim; round head, small ears, long tail held up. Big green eyeshine.
    function cat(run) {
      return silhouette(0.7 * PPM, 0.5 * PPM, function (g) {
        g.beginPath(); g.moveTo(12, 30); g.bezierCurveTo(12, 23, 24, 21, 36, 22); g.bezierCurveTo(44, 22, 48, 25, 48, 29); g.bezierCurveTo(47, 34, 36, 35, 24, 35); g.bezierCurveTo(16, 35, 12, 34, 12, 30); g.fill();
        g.beginPath(); g.arc(52, 22, 7.5, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.moveTo(46.5, 17); g.lineTo(47.5, 10.5); g.lineTo(51.5, 15.5); g.fill();
        g.beginPath(); g.moveTo(53, 15); g.lineTo(57.5, 10.5); g.lineTo(58.5, 18); g.fill();
        var legs = run ? [[16, 31, 5, 40], [21, 33, 25, 42], [40, 31, 33, 42], [45, 30, 55, 37]] : [[16, 32, 16, 43], [21, 33, 22, 43], [40, 32, 40, 43], [44, 31, 45, 43]];
        legs.forEach(function (q) { leg(g, q[0], q[1], q[2], q[3], 4, 3); });
        g.lineWidth = 3; g.beginPath(); g.moveTo(13, 28); g.bezierCurveTo(2, 26, 0, 12, 6, 4); g.bezierCurveTo(8, 1, 11, 2, 11, 5); g.stroke();
      }, function (g) { eyes(g, [[50, 21], [55.5, 21]], 1.1, 'eyeshine-green'); }, [32, 43]);
    }
    // Market chicken: a pale bird the taxi's lamps pick out, red comb. face 1 or -1 turns it round. Placed in threes by a crate.
    function chicken(run, face) {
      var pad = 10, c = mk(0.5 * PPM + pad * 2, 0.5 * PPM + pad * 2), g = c.getContext('2d');
      g.translate(pad, pad); g.scale(PPM / 100, PPM / 100); if (face < 0) { g.translate(50, 0); g.scale(-1, 1); }
      var body = function () { g.beginPath(); g.moveTo(8, 20); g.bezierCurveTo(4, 10, 14, 6, 20, 14); g.bezierCurveTo(26, 18, 32, 18, 34, 14); g.bezierCurveTo(36, 6, 44, 4, 46, 12);
        g.bezierCurveTo(48, 18, 46, 24, 42, 28); g.bezierCurveTo(36, 36, 18, 38, 12, 32); g.bezierCurveTo(8, 28, 8, 24, 8, 20); g.closePath(); };
      g.save(); g.translate(1, -2); body(); g.fillStyle = col('figure-rim'); g.fill(); g.restore();
      body(); var gr = g.createLinearGradient(0, 4, 0, 36); gr.addColorStop(0, col('chicken-light')); gr.addColorStop(1, col('chicken-shade')); g.fillStyle = gr; g.fill();
      g.fillStyle = col('chicken-wing'); g.beginPath(); g.moveTo(10, 22); g.bezierCurveTo(14, 16, 24, 20, 26, 28); g.bezierCurveTo(20, 30, 12, 28, 10, 22); g.fill();
      g.fillStyle = col('face-red'); g.beginPath(); g.moveTo(39, 6); g.lineTo(41, 1); g.lineTo(43, 5); g.lineTo(45, 1); g.lineTo(46, 7); g.closePath(); g.fill();
      g.beginPath(); g.ellipse(46, 17, 1.6, 3, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = col('chicken-beak'); g.beginPath(); g.moveTo(47, 11); g.lineTo(52, 13); g.lineTo(47, 14); g.fill();
      g.strokeStyle = col('chicken-beak'); g.lineWidth = 1.6; g.lineCap = 'round';
      (run ? [[22, 34, 16, 46], [30, 34, 36, 45]] : [[22, 34, 22, 46], [30, 34, 30, 46]]).forEach(function (q) { g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[2], q[3]); g.stroke(); });
      g.fillStyle = col('ink-black'); g.beginPath(); g.arc(43.5, 10, 1.1, 0, Math.PI * 2); g.fill();
      return { c: c, ppm: PPM, ax: pad + 25 * PPM / 100, ay: pad + 46 * PPM / 100 };
    }
    // the market crate of split bamboo they came out of, tipped over
    function crate() {
      var w = 0.7 * PPM, h = 0.45 * PPM, c = mk(w + 20, h + 20), g = c.getContext('2d'); g.translate(10, 10);
      g.fillStyle = col('crate-dark'); g.fillRect(0, 0, w, h);
      g.strokeStyle = col('crate-cane'); g.lineWidth = 0.035 * PPM;
      for (var i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i / 8 * w, 0); g.lineTo(i / 8 * w, h); g.stroke(); }
      for (var j = 0; j <= 3; j++) { g.beginPath(); g.moveTo(0, j / 3 * h); g.lineTo(w, j / 3 * h); g.stroke(); }
      g.strokeStyle = col('figure-rim'); g.globalAlpha = 0.7; g.beginPath(); g.moveTo(0, 1); g.lineTo(w, 1); g.stroke();
      return { c: c, ppm: PPM, ax: 10 + w / 2, ay: 10 + h };
    }

    /* ---------- ROAD OBSTACLES ---------- */
    // Oil slick, 2.8 m across and 6.5 m along: darker than the wet road, with the neon caught in a thin rainbow sheen
    function oil(seed) {
      var W = 512, H = 900, c = mk(W, H), g = c.getContext('2d'), r = rnd(seed || 7), R = [];
      for (var i = 0; i < 14; i++) R.push(0.7 + r() * 0.34);
      var blob = function (gg, sc) {
        var n = R.length, pts = [], m = function (a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
        for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2; pts.push([W / 2 + Math.cos(t) * W * 0.44 * R[i] * sc, H / 2 + Math.sin(t) * H * 0.44 * R[i] * sc]); }
        gg.beginPath(); var p0 = m(pts[n - 1], pts[0]); gg.moveTo(p0[0], p0[1]);
        for (i = 0; i < n; i++) { var q = m(pts[i], pts[(i + 1) % n]); gg.quadraticCurveTo(pts[i][0], pts[i][1], q[0], q[1]); } gg.closePath();
      };
      blob(g, 1); g.fillStyle = rgba(col('oil-dark'), 0.8); g.fill();
      var film = ['tube-pink', 'tube-yellow', 'tube-green', 'tube-blue', 'tube-violet', 'sodium'], lay = mk(W, H), lg = lay.getContext('2d');
      for (var k = 0; k < 12; k++) {
        lg.lineWidth = 26 + (k % 3) * 10; lg.strokeStyle = rgba(col(film[k % film.length]), 0.8);
        var cx = W * (0.3 + r() * 0.4), cy = H * (0.3 + r() * 0.4), rr = W * (0.1 + (k % 5) * 0.06);
        lg.beginPath(); lg.ellipse(cx, cy, rr, rr * (1.5 + r() * 0.8), r() * 3, r() * 2, r() * 2 + Math.PI * 1.3); lg.stroke();
      }
      g.save(); blob(g, 0.96); g.clip(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.6; g.drawImage(blurred(lay, 14), 0, 0); g.restore();
      var mask = mk(W, H), mg = mask.getContext('2d'); mg.filter = 'blur(12px)'; blob(mg, 0.97); mg.fillStyle = '#000'; mg.fill();
      g.globalCompositeOperation = 'destination-in'; g.drawImage(mask, 0, 0); g.globalCompositeOperation = 'source-over';
      return c;
    }
    // Flooded pothole, 1.9 m across and 3.2 m along: a pale broken lip round rainwater that mirrors the lamps and the neon
    function pothole() {
      var W = 400, H = 560, c = mk(W, H), g = c.getContext('2d'), r = rnd(99), E = [];
      for (var i = 0; i < 34; i++) E.push(0.68 + r() * 0.32);
      var edge = function (sc) { g.beginPath(); for (var i = 0; i <= E.length; i++) { var t = i / E.length * Math.PI * 2, k = E[i % E.length]; var x = W / 2 + Math.cos(t) * W * 0.46 * k * sc, y = H / 2 + Math.sin(t) * H * 0.46 * k * sc; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); };
      edge(1.0); g.fillStyle = col('pothole-lip'); g.fill();
      edge(0.9); g.fillStyle = col('pothole-edge'); g.fill();
      edge(0.82); var gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, col('sodium')); gr.addColorStop(0.35, shade('sodium', -0.4)); gr.addColorStop(0.75, col('road-far')); gr.addColorStop(1, col('night-black'));
      g.fillStyle = gr; g.fill();
      g.save(); edge(0.82); g.clip();
      g.fillStyle = rgba(col('tube-pink'), 0.3); g.fillRect(W * 0.58, 0, W * 0.08, H);
      g.strokeStyle = rgba(col('face-cream'), 0.45); g.lineWidth = 4;
      [[150, 220, 46], [252, 320, 60], [180, 400, 34], [262, 180, 28]].forEach(function (q) { g.beginPath(); g.ellipse(q[0], q[1], q[2], q[2] * 0.75, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.ellipse(q[0], q[1], q[2] * 0.5, q[2] * 0.38, 0, 0, Math.PI * 2); g.stroke(); });
      g.restore();
      g.fillStyle = shade('pothole-lip', 0.1);
      for (i = 0; i < 16; i++) { var t = r() * Math.PI * 2; g.fillRect(W / 2 + Math.cos(t) * W * 0.52 - 7, H / 2 + Math.sin(t) * H * 0.52 - 5, 12 + r() * 10, 8 + r() * 8); }
      return c;
    }
    // a traffic cone, 0.72 m: orange with two white bands
    function cone(g, pt, d, x) {
      var b0 = pt(d, x - 0.2, 0), b1 = pt(d, x + 0.2, 0), t0 = pt(d, x - 0.035, 0.72), t1 = pt(d, x + 0.035, 0.72);
      if (!b0 || !b1 || !t0 || !t1) return;
      shadow(g, pt, d - 0.2, x, 0.5, 0.4, 0.3);
      var bw = b1.x - b0.x;
      g.fillStyle = col('case'); g.fillRect(b0.x - bw * 0.15, b0.y - bw * 0.12, bw * 1.3, bw * 0.14);
      var gr = g.createLinearGradient(b0.x, 0, b1.x, 0); gr.addColorStop(0, shade('cone-orange', -0.28)); gr.addColorStop(0.45, col('cone-orange')); gr.addColorStop(1, shade('cone-orange', -0.45));
      g.beginPath(); g.moveTo(b0.x, b0.y - bw * 0.1); g.lineTo(b1.x, b1.y - bw * 0.1); g.lineTo(t1.x, t1.y); g.lineTo(t0.x, t0.y); g.closePath(); g.fillStyle = gr; g.fill();
      var L = function (a, b, t) { return a + (b - a) * t; };
      [[0.3, 0.42], [0.58, 0.68]].forEach(function (f) {
        g.beginPath(); g.moveTo(L(b0.x, t0.x, f[0]), L(b0.y, t0.y, f[0])); g.lineTo(L(b1.x, t1.x, f[0]), L(b0.y, t0.y, f[0]));
        g.lineTo(L(b1.x, t1.x, f[1]), L(b0.y, t0.y, f[1])); g.lineTo(L(b0.x, t0.x, f[1]), L(b0.y, t0.y, f[1])); g.closePath(); g.fillStyle = rgba(col('face-white'), 0.92); g.fill();
      });
    }
    // Roadworks closing one lane (lane centre x, barriers at d): four cones leading out from the kerb, three water-filled
    // barriers, red and white, 1.05 m each, with amber lamps, and a 道路工程 ROAD WORKS sign. lampsA: which pair is lit
    // (the lamps take turns, half a second each).
    function roadworks(g, pt, d, x, o) {
      o = o || {};
      var k = x < 0 ? -1 : 1, i;
      for (i = 0; i < 4; i++) cone(g, pt, d - 7 + i * 1.8, x + k * 1.35 - k * i * 0.75);
      var n = 3, bw = 1.05;
      for (i = 0; i < n; i++) {
        var bx = x - (n - 1) / 2 * bw + i * bw, red = i % 2 === 0, base = red ? 'face-red' : 'face-white';
        shadow(g, pt, d, bx, bw, 0.5, 0.35);
        box(g, pt, d, bx, bw - 0.04, 0.5, 0.95, red ? [shade(base, 0.2), col(base), shade(base, -0.3)] : [col(base), shade(base, -0.08), shade(base, -0.3)], { camX: o.camX, front: (function (red) { return function (q) {
          var a = q[0], b = q[1], t = q[3], h = a.y - t.y; g.fillStyle = red ? rgba(col('face-white'), 0.85) : rgba(col('face-red'), 0.9); g.fillRect(t.x + (b.x - a.x) * 0.08, t.y + h * 0.3, (b.x - a.x) * 0.84, h * 0.12);
        }; })(red) });
        var lp = pt(d + 0.25, bx, 1.08); if (!lp) continue;
        var on = o.lampsA === false ? i % 2 === 1 : i % 2 === 0, rad = 0.09 * lp.s, amber = col('lamp-amber');
        g.fillStyle = col('case'); g.fillRect(lp.x - rad * 0.8, lp.y + rad * 0.2, rad * 1.6, rad * 1.6);
        g.fillStyle = on ? shade('lamp-amber', 0.45) : shade('lamp-amber', -0.5); g.beginPath(); g.arc(lp.x, lp.y, rad, 0, Math.PI * 2); g.fill();
        if (on) { var gl = g.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, rad * 7); gl.addColorStop(0, rgba(amber, 0.75)); gl.addColorStop(1, rgba(amber, 0)); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gl; g.fillRect(lp.x - rad * 7, lp.y - rad * 7, rad * 14, rad * 14); g.restore(); }
      }
      // the sign on its stand, ahead of the barriers: face-yellow, ink-black lettering
      var sx = x - (n * bw) / 2 + 0.35, sd = d - 1.2, l1 = pt(sd, sx - 0.04, 0), l2 = pt(sd, sx + 0.04, 1.05), r1 = pt(sd, sx + 0.86, 0);
      if (l1 && l2 && r1) { g.fillStyle = col('case'); g.fillRect(l1.x - 1, l2.y, 2, l1.y - l2.y); g.fillRect(r1.x - 1, l2.y, 2, l1.y - l2.y); }
      var tl = pt(sd, sx - 0.1, 1.55), br = pt(sd, sx + 1.0, 0.85);
      if (tl && br) {
        var w = br.x - tl.x, h = br.y - tl.y;
        g.fillStyle = col('case'); g.fillRect(tl.x - w * 0.04, tl.y - h * 0.06, w * 1.08, h * 1.12);
        var sg = g.createLinearGradient(0, tl.y, 0, br.y); sg.addColorStop(0, shade('face-yellow', 0.35)); sg.addColorStop(1, shade('face-yellow', -0.1)); g.fillStyle = sg; g.fillRect(tl.x, tl.y, w, h);
        g.fillStyle = col('ink-black'); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        g.font = '900 ' + h * 0.46 + 'px "Noto Serif TC", serif'; g.fillText('道路工程', tl.x + w / 2, tl.y + h * 0.56);
        g.font = '700 ' + h * 0.26 + 'px Antonio, sans-serif'; if ('letterSpacing' in g) g.letterSpacing = (h * 0.03) + 'px'; g.fillText('ROAD WORKS', tl.x + w / 2, tl.y + h * 0.9); if ('letterSpacing' in g) g.letterSpacing = '0px';
        var yl = g.createRadialGradient(tl.x + w / 2, tl.y + h / 2, 0, tl.x + w / 2, tl.y + h / 2, w); yl.addColorStop(0, rgba(col('face-yellow'), 0.28)); yl.addColorStop(1, rgba(col('face-yellow'), 0));
        g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = yl; g.fillRect(tl.x - w / 2, tl.y - w / 2, w * 2, h + w); g.restore();
      }
    }
    // Spilt cargo across about 2.6 m of a lane (centre d, x): cardboard boxes off a lorry, marked 易碎, one burst open, oranges rolling
    function cargo(g, pt, d, x, o) {
      o = o || {};
      var card = [shade('cardboard', 0.22), col('cardboard'), shade('cardboard', -0.25)], red = col('ink-red');
      var label = function (q) { var a = q[0], b = q[1], t = q[3], w = b.x - a.x, h = a.y - t.y; if (w < 6) return;
        g.fillStyle = rgba(red, 0.85); g.font = '900 ' + h * 0.34 + 'px "Noto Serif TC", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('易碎', t.x + w / 2, t.y + h * 0.5);
        g.strokeStyle = rgba(red, 0.7); g.lineWidth = Math.max(0.6, w * 0.02); g.strokeRect(t.x + w * 0.18, t.y + h * 0.22, w * 0.64, h * 0.56); };
      var tape = function (q) { g.strokeStyle = col('parcel-tape'); g.lineWidth = Math.max(0.8, Math.abs(q[1].x - q[0].x) * 0.08); g.beginPath(); g.moveTo((q[0].x + q[1].x) / 2, (q[0].y + q[1].y) / 2); g.lineTo((q[2].x + q[3].x) / 2, (q[2].y + q[3].y) / 2); g.stroke(); };
      var r = rnd(5), i;
      for (i = 0; i < 16; i++) {   // oranges first: they are on the road
        var p = pt(d - 1.6 + r() * 3.2, x - 1.4 + r() * 2.6, 0.05); if (!p) continue; var rad = 0.06 * p.s;
        g.fillStyle = rgba(col('case'), 0.35); g.beginPath(); g.ellipse(p.x, p.y + rad * 0.9, rad * 1.1, rad * 0.35, 0, 0, Math.PI * 2); g.fill();
        var og = g.createRadialGradient(p.x - rad * 0.3, p.y - rad * 0.4, 0, p.x, p.y, rad); og.addColorStop(0, shade('fruit-orange', 0.4)); og.addColorStop(1, shade('fruit-orange', -0.15)); g.fillStyle = og; g.beginPath(); g.arc(p.x, p.y, rad, 0, Math.PI * 2); g.fill();
      }
      var boxes = [[d + 1.2, x + 0.9, 0.6, 0.5, 0.45, true], [d + 0.6, x - 0.7, 0.55, 0.55, 0.5, false], [d - 0.4, x + 0.2, 0.6, 0.6, 0.55, true], [d + 1.6, x - 1.1, 0.5, 0.45, 0.42, false]];
      boxes.sort(function (a, b) { return b[0] - a[0]; });
      boxes.forEach(function (q) { shadow(g, pt, q[0], q[1], q[2], q[3], 0.4); box(g, pt, q[0], q[1], q[2], q[3], q[4], card, { camX: o.camX, front: q[5] ? label : null, top: tape }); });
      var bd = d - 1.2, bx = x - 0.4; shadow(g, pt, bd, bx, 0.7, 0.5, 0.4);
      box(g, pt, bd, bx, 0.7, 0.5, 0.4, card, { camX: o.camX, front: function (q) { var a = q[0], b = q[1], t = q[3]; g.fillStyle = shade('cardboard', -0.7); g.fillRect(t.x + (b.x - a.x) * 0.1, t.y + (a.y - t.y) * 0.12, (b.x - a.x) * 0.8, (a.y - t.y) * 0.76);
        for (var j = 0; j < 3; j++) { g.fillStyle = col('fruit-orange'); g.beginPath(); g.arc(t.x + (b.x - a.x) * (0.3 + j * 0.2), t.y + (a.y - t.y) * 0.72, (b.x - a.x) * 0.09, 0, Math.PI * 2); g.fill(); } } });
      var f0 = pt(bd, bx - 0.35, 0.4), f1 = pt(bd, bx + 0.35, 0.4), f2 = pt(bd - 0.3, bx + 0.42, 0.62), f3 = pt(bd - 0.3, bx - 0.28, 0.62);
      if (f0 && f1 && f2 && f3) { poly(g, [f0, f1, f2, f3]); g.fillStyle = card[0]; g.fill(); }
    }

    /* ---------- THE PASSENGER: the one person in the street drawn sharp and in colour, at the kerb with an arm up ----------
       kind: 'plain' (red coat) | 'case' (blue-grey coat, a suitcase) | 'bags' (olive coat, shopping). pose 0: arm high; 1: waving. */
    var COAT = { plain: 'coat-red', 'case': 'coat-blue', bags: 'coat-olive' };
    function passenger(kind, pose) {
      var ppm = 140, w = 1.4 * ppm, h = 2.35 * ppm, c = mk(w, h), g = c.getContext('2d');
      var cx = w * 0.4, foot = h - 8, Ht = 1.7 * ppm, top = foot - Ht, k = Ht / 196, rimC = col('figure-rim');
      g.save(); g.translate(cx, top); g.scale(k, k); g.translate(-60, 0);
      var limb = function (x0, y0, len, ang, w0, w1, fill) { g.fillStyle = fill; var x1 = x0 + Math.sin(ang) * len, y1 = y0 + Math.cos(ang) * len, nx = Math.cos(ang), ny = -Math.sin(ang);
        g.beginPath(); g.moveTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); g.lineTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); g.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); g.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2); g.closePath(); g.fill();
        g.beginPath(); g.arc(x1, y1, w1 / 2, 0, Math.PI * 2); g.fill(); return [x1, y1]; };
      var draw = function (rim) {
        var C = function (t) { return rim ? rimC : col(t); };
        limb(53, 100, 92, 0.02, 15, 9, C('trouser-dark')); limb(67, 100, 92, -0.02, 15, 9, C('trouser-dark'));
        g.fillStyle = C('hair-dark'); g.beginPath(); g.ellipse(52, 194, 9, 4, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(69, 194, 9, 4, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = C(COAT[kind] || 'coat-red'); g.beginPath(); g.moveTo(37, 34); g.quadraticCurveTo(40, 26, 60, 25); g.quadraticCurveTo(80, 26, 83, 34); g.lineTo(86, 140); g.lineTo(34, 140); g.closePath(); g.fill();
        limb(40, 36, 68, 0.08, 11, 8, C(COAT[kind] || 'coat-red')); limb(40, 36 + 68 * Math.cos(0.08), 4, 0.08, 8, 9, C('skin'));
        var a1 = pose ? Math.PI - 1.0 : Math.PI - 0.45, a2 = pose ? Math.PI - 0.35 : Math.PI - 0.1;   // the hailing arm, towards the road
        var e = limb(80, 36, 42, a1, 11, 9, C(COAT[kind] || 'coat-red')); limb(e[0], e[1], 32, a2, 9, 8, C(COAT[kind] || 'coat-red'));
        g.fillStyle = C('skin'); g.beginPath(); g.arc(e[0] + Math.sin(a2) * 35, e[1] + Math.cos(a2) * 35, 6, 0, Math.PI * 2); g.fill();
        g.fillRect(55, 17, 10, 12); g.beginPath(); g.ellipse(60, 11, 10.5, 13, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = C('hair-dark'); g.beginPath(); g.ellipse(60, 5, 11, 8, 0, Math.PI, 0); g.fill(); g.fillRect(49, 3, 4, 12);
        if (kind === 'case') { g.fillStyle = C('suitcase-blue'); g.beginPath(); if (g.roundRect) g.roundRect(8, 128, 26, 56, 4); else g.rect(8, 128, 26, 56); g.fill(); g.fillStyle = C('hair-dark'); g.fillRect(19, 116, 4, 12); g.fillRect(12, 184, 5, 6); g.fillRect(26, 184, 5, 6); }
        if (kind === 'bags') { g.fillStyle = C('bag-paper'); g.fillRect(26, 104, 22, 28); g.fillStyle = C('face-red'); g.fillRect(16, 110, 18, 24); }
      };
      g.save(); g.translate(2.5, -2); g.globalAlpha = 0.8; draw(true); g.restore();   // the shops' light along the edges
      draw(false);
      g.globalCompositeOperation = 'source-atop';                                       // the street's light on the side facing the road
      var gr = g.createLinearGradient(20, 0, 100, 0); gr.addColorStop(0, rgba(col('sodium'), 0)); gr.addColorStop(1, rgba(col('sodium'), 0.28)); g.fillStyle = gr; g.fillRect(0, -20, 120, 230);
      g.restore();
      return { c: c, ppm: ppm, ax: cx, ay: foot };
    }
    // the warm pool of light every passenger stands in, 2.8 m across, drawn on the pavement under them
    function pool() {
      var p = mk(200, 200), pg = p.getContext('2d'), gr = pg.createRadialGradient(100, 100, 0, 100, 100, 100);
      gr.addColorStop(0, rgba(shade('sodium', 0.3), 0.6)); gr.addColorStop(1, rgba(col('sodium'), 0)); pg.fillStyle = gr; pg.fillRect(0, 0, 200, 200);
      return p;
    }

    /* ---------- THE STOP ZONE: a painted bay, 3 m across and 10 m along, in the kerbside lane (Barney, option A) ----------
       kind 'pickup': tube-teal, 上客 PICK-UP; 'dropoff': tube-pink, 落客 DROP-OFF. */
    var BAY = { pickup: ['tube-teal', 'tube-core-teal', '上客', 'PICK-UP'], dropoff: ['tube-pink', 'tube-core-pink', '落客', 'DROP-OFF'] };
    function bay(kind) {
      var b = BAY[kind] || BAY.pickup, c0 = col(b[0]), c1 = col(b[1]);
      var W = 300, H = 1000, c = mk(W, H), g = c.getContext('2d'), lw = 16;   // 100 pixels per metre
      g.fillStyle = rgba(c0, 0.13); g.fillRect(0, 0, W, H);                   // a faint wash of the colour
      g.fillStyle = rgba(c0, 0.95); g.fillRect(0, 0, W, lw); g.fillRect(0, H - lw, W, lw);   // solid ends, dashed sides
      for (var y = 0; y < H; y += 80) { g.fillRect(0, y, lw, 50); g.fillRect(W - lw, y, lw, 50); }
      g.save(); g.translate(W / 2, H * 0.5); g.scale(1, 2.6); g.fillStyle = rgba(c1, 0.92); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '700 92px "Noto Sans TC", sans-serif'; g.fillText(b[2], 0, -40);   // stretched along the road, as road lettering is
      g.font = '700 54px Antonio, sans-serif'; if ('letterSpacing' in g) g.letterSpacing = '4px'; g.fillText(b[3], 0, 40);
      g.restore();
      var spill = mk(200, 200), sg = spill.getContext('2d'), sgr = sg.createRadialGradient(100, 100, 0, 100, 100, 100);   // fades to nothing before its edges
      sgr.addColorStop(0, rgba(c0, 0.35)); sgr.addColorStop(1, rgba(c0, 0)); sg.fillStyle = sgr; sg.fillRect(0, 0, 200, 200);
      return { paint: c, glow: blurred(c, 10), spill: spill };
    }
    // draw a bay made by bay(): its light on the wet road, the paint, then the paint's glow
    function drawBay(g, pt, b, d0, d1, x0, x1) {
      decal(g, pt, b.spill, d0 - 3, d1 + 3, x0 - 1.5, x1 + 1.5, 0.55, 'lighter');
      decal(g, pt, b.paint, d0, d1, x0, x1, 0.88);
      decal(g, pt, b.glow, d0, d1, x0, x1, 0.6, 'lighter');
    }

    return {
      PPM: PPM, stand: stand, decal: decal, shadow: shadow, box: box,
      boar: boar, dog: dog, cat: cat, chicken: chicken, crate: crate,
      oil: oil, pothole: pothole, cone: cone, roadworks: roadworks, cargo: cargo,
      passenger: passenger, pool: pool, bay: bay, drawBay: drawBay,
      // true sizes in metres (Barney, 29 October 2026: true size)
      sizes: { boar: [1.4, 0.9], dog: [1.0, 0.62], cat: [0.5, 0.3], chicken: [0.45, 0.4], crate: [0.7, 0.45], oil: [2.8, 6.5], pothole: [1.9, 3.2],
        barriers: [3.15, 0.95], cone: [0.4, 0.72], cargo: [2.6, 3.2], passenger: [0.6, 1.7], pool: [2.8, 2.8], bay: [3, 10] }
    };
  })();

  return { digits: digits, mountDigits: mountDigits, fare: fare, crashPop: POP, drawCrashPop: drawCrashPop, street: street, version: '0.3.0' };
})();
