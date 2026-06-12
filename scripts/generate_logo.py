#!/usr/bin/env python3
"""
Generates the Candy Kingdom Crush app logo as a transparent PNG using only
Pillow — a glossy candy-swirl emblem (gold ring + pink/white peppermint swirl
+ highlight + sparkles) tuned to the in-app theme palette.

Outputs src/assets/images/logo.png (and @2x/@3x density variants).
Run:  python3 scripts/generate_logo.py
"""

import math
import os

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "src", "assets", "images")

# Master render size (downscaled for the density variants at the end).
SIZE = 1024

# Theme palette (mirrors src/constants/theme.ts).
GOLD = (255, 217, 61)        # palette.accent
GOLD_DARK = (244, 163, 0)    # palette.accentDark
PINK = (255, 77, 109)        # CANDY_THEME[0] lollipop
PINK_LIGHT = (255, 143, 163)
WHITE = (255, 255, 255)
PURPLE = (46, 11, 110)       # palette.panel

# Swirl geometry.
ARMS = 5          # number of stripes around the rim
TWIST = 7.5       # how many radians the stripes spiral from centre to edge


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def clamp(v, lo=0.0, hi=1.0):
    return lo if v < lo else hi if v > hi else v


def main():
    cx = cy = SIZE / 2.0
    r_out = SIZE / 2.0 - 16        # outer edge of the gold ring
    ring_w = SIZE * 0.085          # ring thickness
    r_candy = r_out - ring_w       # candy disk radius

    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    px = img.load()

    # Light direction for the glossy shading (upper-left).
    lx, ly = -0.45, -0.55

    for y in range(SIZE):
        dy = y - cy
        for x in range(SIZE):
            dx = x - cx
            r = math.hypot(dx, dy)
            if r > r_out + 1.5:
                continue

            if r <= r_candy + 0.5:
                # --- Candy swirl ---------------------------------------
                theta = math.atan2(dy, dx)
                rn = r / r_candy
                phase = ARMS * theta + TWIST * rn
                v = (math.sin(phase) + 1.0) / 2.0
                # Crisp stripes with a small anti-aliased transition band.
                aa = 0.10
                m = clamp((v - (0.5 - aa)) / (2 * aa))
                col = lerp(WHITE, PINK, m)

                # Soft radial shading + glossy highlight.
                shade = 1.0 - 0.22 * (rn ** 2)
                spec = clamp((dx * lx + dy * ly) / r_candy) if r > 1 else 0.0
                shade += 0.30 * (spec ** 1.6)
                col = lerp((0, 0, 0), col, clamp(shade, 0.0, 1.0))
                # Lighten the pink a touch where lit so it reads candy-glossy.
                col = lerp(col, PINK_LIGHT, 0.18 * (spec ** 2) * m)

                # Anti-alias the outer edge of the candy into the ring.
                edge = clamp((r_candy - r) / 1.4 + 0.5)
                if edge < 1.0:
                    col = lerp(GOLD_DARK, col, edge)
                px[x, y] = (col[0], col[1], col[2], 255)

            elif r <= r_out + 1.5:
                # --- Gold ring with vertical bevel ---------------------
                t = (y) / SIZE  # 0 top -> 1 bottom
                base = lerp(lerp(WHITE, GOLD, 0.7), GOLD_DARK, clamp(t * 1.1))
                # Inner & outer rim shadows for a beveled coin look.
                rim_in = clamp((r - r_candy) / (ring_w * 0.5))
                rim_out = clamp((r_out - r) / (ring_w * 0.5))
                bevel = min(rim_in, rim_out)
                col = lerp(GOLD_DARK, base, clamp(0.35 + 0.65 * bevel))
                # Outer-edge alpha anti-aliasing.
                a = clamp((r_out - r) / 1.4 + 0.5)
                px[x, y] = (col[0], col[1], col[2], int(255 * a))

    draw = ImageDraw.Draw(img)

    # Glossy top highlight sweeping across the candy.
    gloss = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gloss)
    gd.ellipse(
        [cx - r_candy * 0.78, cy - r_candy * 0.95,
         cx + r_candy * 0.78, cy - r_candy * 0.15],
        fill=(255, 255, 255, 70),
    )
    gloss = gloss.filter(ImageFilter.GaussianBlur(SIZE * 0.02))
    # Clip the gloss to the candy disk.
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).ellipse(
        [cx - r_candy, cy - r_candy, cx + r_candy, cy + r_candy], fill=255
    )
    img.paste(gloss, (0, 0), Image.composite(gloss.split()[3], Image.new("L", (SIZE, SIZE), 0), mask))

    # Sparkle stars around the emblem.
    def star(scx, scy, s, color):
        pts = []
        for i in range(8):
            ang = math.pi / 4 * i
            rad = s if i % 2 == 0 else s * 0.4
            pts.append((scx + math.cos(ang) * rad, scy + math.sin(ang) * rad))
        draw.polygon(pts, fill=color)

    for ang, rad, s in [
        (-0.35, r_out * 0.96, SIZE * 0.045),
        (math.pi * 0.62, r_out * 0.99, SIZE * 0.032),
        (math.pi * 1.18, r_out * 0.97, SIZE * 0.026),
    ]:
        sx = cx + math.cos(ang) * rad
        sy = cy + math.sin(ang) * rad
        star(sx, sy, s, (255, 255, 255, 235))
        star(sx, sy, s * 0.55, GOLD + (255,))

    os.makedirs(OUT_DIR, exist_ok=True)
    # Density variants: logo.png (1x), @2x, @3x. Base display ~168pt.
    variants = {"logo.png": 384, "logo@2x.png": 768, "logo@3x.png": 1024}
    for name, size in variants.items():
        out = img.resize((size, size), Image.LANCZOS)
        out.save(os.path.join(OUT_DIR, name))
        print(f"wrote {name} ({size}x{size})")


if __name__ == "__main__":
    main()
