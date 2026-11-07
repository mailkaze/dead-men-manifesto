#!/usr/bin/env python3
"""Construye index.html (un único archivo jugable) a partir de src/game.html y assets/.

Uso:  python3 tools/build.py
Tokens que se sustituyen en src/game.html:
  __ASSET:ruta.png__        -> data URL base64 de la imagen
  __ASSET_JSON:ruta.json__  -> contenido literal del JSON
"""
import base64, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / 'src' / 'game.html').read_text(encoding='utf-8')

def as_json(m):
    return (ROOT / m.group(1)).read_text(encoding='utf-8')

def as_png(m):
    data = (ROOT / m.group(1)).read_bytes()
    return 'data:image/png;base64,' + base64.b64encode(data).decode()

out = re.sub(r'__ASSET_JSON:(.+?\.json)__', as_json, src)
out = re.sub(r'__ASSET:(.+?\.png)__', as_png, out)
(ROOT / 'index.html').write_text(out, encoding='utf-8')
print(f'index.html generado ({len(out)//1024} KB)')
