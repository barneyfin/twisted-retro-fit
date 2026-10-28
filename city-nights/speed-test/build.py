"""Build the City Nights speed test into one page: index.html.

Run from this folder:  python build.py
It joins the four source parts in order: src/head.html (page and styles), src/street-gen.js (the
round 9 street, unchanged), src/gl.js (the WebGL2 drawing) and src/tail.js (meter, measuring, page).
"""
import hashlib, os
here = os.path.dirname(os.path.abspath(__file__))
read = lambda p: open(os.path.join(here, 'src', p), encoding='utf8').read()
out = '\n'.join([read('head.html'), read('street-gen.js').rstrip('\n'), read('gl.js'), read('tail.js')])
with open(os.path.join(here, 'index.html'), 'w', encoding='utf8', newline='\n') as f: f.write(out)
print('index.html', len(out.encode('utf8')), 'bytes, sha256', hashlib.sha256(out.encode('utf8')).hexdigest()[:16])
