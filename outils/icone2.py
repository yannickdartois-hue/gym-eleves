"""Icônes gym à partir du visuel choisi par Yannick : carré arrondi recoloré au vert sarcelle de la gym (#0f766e),
fond pâle de la charte (#dff2ef), étiquette ÉLÈVE / PROF."""
import sys, colorsys
from PIL import Image, ImageDraw, ImageFont
src, mot, out = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(src).convert('RGB').resize((1024, 1024), Image.LANCZOS)
W, H = im.size; px = im.load()
FOND = (223, 242, 239)  # #dff2ef
def hsv(p): return colorsys.rgb_to_hsv(*[c / 255 for c in p])
for y in range(H):
    for x in range(W):
        h, s, v = hsv(px[x, y])
        if 0.44 < h < 0.56 and s > 0.12:          # encadré turquoise → vert sarcelle, dégradés conservés
            r, g, b = colorsys.hsv_to_rgb(0.487, min(1, s * 1.05), v * 0.64)
            px[x, y] = (int(r * 255), int(g * 255), int(b * 255))
        elif s < 0.08 and v > 0.70:                  # fond blanc/gris (avec l'ombre) → fond pâle, ombre conservée
            k = v / 0.97
            px[x, y] = tuple(int(min(255, c * k)) for c in FOND)
d = ImageDraw.Draw(im)
f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 92)
tw = d.textlength(mot, font=f); x0, y0 = 24, 22
fond, encre = ('#ffffff', '#0b4f4a') if mot != 'PROF' else ('#1c2128', '#ffffff')
d.rounded_rectangle([x0, y0, x0 + tw + 56, y0 + 128], radius=32, fill=fond, outline='#0b4f4a', width=7)
d.text((x0 + 28, y0 + 12), mot, font=f, fill=encre)
for n in (512, 192, 180, 32): im.resize((n, n), Image.LANCZOS).save(f'{out}/icon-{n}.png')
