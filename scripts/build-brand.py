"""
Builds the Lantrn brand assets from the source artwork.

    python scripts/build-brand.py

The source is black line art with an amber flame on transparency. Two problems
have to be solved before it can be a logo:

  1. It is mostly empty space, so it reads tiny in a fixed-size slot.
  2. Black linework disappears on the dark theme.

So this crops to the artwork, then produces a dark-theme variant that lightens
the *linework only* — the flame keeps its colour, because the flame is the
brand. A blanket CSS invert would have turned the amber blue.
"""
import os
from PIL import Image

SRC = r'C:\Users\SeanDaniel\Pictures\Lantrn\lanternflame.png'
OUT = os.path.join('public', 'brand')
os.makedirs(OUT, exist_ok=True)

img = Image.open(SRC).convert('RGBA')

# --- 1. Crop to the artwork ------------------------------------------------
# The source is padded with transparency and/or white. Treat both as empty.
px = img.load()
w, h = img.size
minx, miny, maxx, maxy = w, h, -1, -1
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        # Anything visible and not near-white counts as ink.
        if a > 24 and not (r > 244 and g > 244 and b > 244):
            if x < minx: minx = x
            if x > maxx: maxx = x
            if y < miny: miny = y
            if y > maxy: maxy = y

pad = int(max(maxx - minx, maxy - miny) * 0.04)
box = (max(0, minx - pad), max(0, miny - pad), min(w, maxx + pad + 1), min(h, maxy + pad + 1))
art = img.crop(box)
print('cropped %dx%d -> %dx%d' % (w, h, art.width, art.height))

# --- 2. Square it, so every slot can be a square ---------------------------
side = max(art.width, art.height)
square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
square.paste(art, ((side - art.width) // 2, (side - art.height) // 2), art)

# --- 3. Dark-theme variant -------------------------------------------------
# Lighten only the near-neutral pixels. Saturated pixels are the flame and are
# left exactly as they are.
def for_dark(src, ink=(241, 238, 232)):
    out = src.copy()
    p = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = p[x, y]
            if a == 0:
                continue
            # Absolute colourfulness, not a ratio. Relative saturation is
            # meaningless near black: (2,1,0) computes as fully saturated and
            # every line in the drawing gets mistaken for the flame.
            mx, mn = max(r, g, b), min(r, g, b)
            is_coloured = (mx - mn) >= 30 and mx >= 60
            if not is_coloured:                      # neutral: linework
                lum = (r + g + b) / 3
                t = 1 - (lum / 255)                  # darker source -> lighter ink
                p[x, y] = (
                    int(ink[0] * t + r * (1 - t)),
                    int(ink[1] * t + g * (1 - t)),
                    int(ink[2] * t + b * (1 - t)),
                    a,
                )
    return out

def fill_transparent_rgb(src, rgb):
    """
    Transparent pixels still carry RGB, and a resample blends across the alpha
    edge. With transparent RGB left at black, the pale linework gets dragged
    back to dark on every downscale. Flooding the invisible pixels with the ink
    colour keeps the edges clean.
    """
    out = src.copy()
    p = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = p[x, y]
            if a == 0:
                p[x, y] = (rgb[0], rgb[1], rgb[2], 0)
    return out


INK_DARK = (241, 238, 232)
dark = fill_transparent_rgb(for_dark(square), INK_DARK)
square = fill_transparent_rgb(square, (23, 21, 15))

# --- 4. Write every size the interface actually asks for -------------------
SRC_OUT = os.path.join('src', 'assets', 'brand')
os.makedirs(SRC_OUT, exist_ok=True)

# Component art is imported rather than served from /public, so that the
# single-file standalone build inlines it instead of requesting a file that
# will not be there. The largest on-screen use is 44px, so 128 is ample and
# keeps the inlined payload small.
targets = [
    (SRC_OUT, 'lantern.png', square, 128),
    (SRC_OUT, 'lantern-dark.png', dark, 128),
    # Favicons and manifest icons are fetched by URL, so these stay in /public.
    (OUT, 'favicon-32.png', square, 32),
    (OUT, 'favicon-32-dark.png', dark, 32),
    (OUT, 'apple-touch-icon.png', square, 180),
    (OUT, 'icon-192.png', square, 192),
    (OUT, 'icon-512.png', square, 512),
]

for folder, name, source, size in targets:
    resized = source.resize((size, size), Image.LANCZOS)
    path = os.path.join(folder, name)
    resized.save(path, 'PNG', optimize=True)
    print('%-34s %4dpx  %6d bytes' % (path, size, os.path.getsize(path)))
