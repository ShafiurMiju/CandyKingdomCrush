#!/usr/bin/env python3
"""
Generates the crown + wordmark launch logo as a transparent PNG using Pillow —
a jeweled gold crown (Kingdom) studded with candy-coloured gems (Candy) above
the "Candy Kingdom / CRUSH" title. Colours read on a light background.

Used by the native launch screen (iOS LaunchScreen.storyboard / Android
windowBackground) via generate_splash.py. The Home screen uses the text-only
logo_wordmark.png.

Outputs src/assets/images/logo_crown.png (and @2x/@3x density variants).
Run:  python3 scripts/generate_logo_crown.py
"""

import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "src", "assets", "images")

W, H = 1024, 1120

# Gold crown.
GOLD_HI = (255, 233, 138)
GOLD_DARK = (244, 163, 0)
GOLD_EDGE = (140, 82, 0)

# Wordmark colours (read on a light background).
GOLD = (247, 168, 0)         # "Candy Kingdom" fill
TITLE_STROKE = (74, 42, 8)   # warm brown outline
PINK = (255, 61, 133)        # "CRUSH" fill
PINK_STROKE = (150, 28, 74)  # deep magenta outline

# Candy gems for the crown points (purple/blue/pink/green/orange).
GEMS = [
    (155, 93, 229),
    (77, 150, 255),
    (255, 77, 109),
    (107, 203, 119),
    (255, 159, 69),
]

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf",
    "/Library/Fonts/Arial Rounded Bold.ttf",
    "/System/Library/Fonts/SFNSRounded.ttf",
    "/System/Library/Fonts/SFCompactRounded.ttf",
]


def load_font(size):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def darker(color, t=0.35):
    return lerp(color, (0, 0, 0), t)


def gradient_image(top, bottom, y0, y1):
    grad = Image.new("RGB", (W, H))
    gd = ImageDraw.Draw(grad)
    span = max(1, y1 - y0)
    for y in range(H):
        t = (y - y0) / span
        t = 0.0 if t < 0 else 1.0 if t > 1 else t
        gd.line([(0, y), (W, y)], fill=lerp(top, bottom, t))
    return grad


def gem(draw, cx, cy, r, color):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=darker(color, 0.45))
    ri = r * 0.84
    draw.ellipse([cx - ri, cy - ri, cx + ri, cy + ri], fill=color)
    draw.pieslice([cx - ri, cy - ri, cx + ri, cy + ri], 20, 160,
                  fill=darker(color, 0.22))
    hr = r * 0.34
    hx, hy = cx - r * 0.30, cy - r * 0.34
    draw.ellipse([hx - hr, hy - hr * 0.7, hx + hr, hy + hr * 0.7],
                 fill=(255, 255, 255, 210))


def text_with_shadow(base, center_x, center_y, text, font, fill, stroke,
                     stroke_w, tracking=0):
    advances = [font.getlength(ch) for ch in text]
    total = sum(advances) + tracking * (len(text) - 1)
    ascent, descent = font.getmetrics()
    top = center_y - (ascent + descent) / 2

    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    x = center_x - total / 2
    for ch, adv in zip(text, advances):
        sd.text((x, top + 10), ch, font=font, fill=(0, 0, 0, 150),
                stroke_width=stroke_w, stroke_fill=(0, 0, 0, 150))
        x += adv + tracking
    shadow = shadow.filter(ImageFilter.GaussianBlur(9))
    base.alpha_composite(shadow)

    fg = ImageDraw.Draw(base)
    x = center_x - total / 2
    for ch, adv in zip(text, advances):
        fg.text((x, top), ch, font=font, fill=fill,
                stroke_width=stroke_w, stroke_fill=stroke)
        x += adv + tracking


def main():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cx = W / 2

    # ---- Crown silhouette ----------------------------------------------
    band_bottom = 560
    valley = 430
    tips = [(192, 304), (352, 252), (512, 196), (672, 252), (832, 304)]
    valleys_x = [272, 432, 592, 752]
    crown = [(192, band_bottom), (192, tips[0][1])]
    for i, (tx, ty) in enumerate(tips):
        crown.append((tx, ty))
        if i < len(valleys_x):
            crown.append((valleys_x[i], valley))
    crown.append((832, band_bottom))

    grad = gradient_image(GOLD_HI, GOLD_DARK, 196, band_bottom).convert("RGBA")
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).polygon(crown, fill=255)
    img.paste(grad, (0, 0), mask)

    draw = ImageDraw.Draw(img)
    draw.line(crown + [crown[0]], fill=GOLD_EDGE + (255,), width=9,
              joint="curve")

    draw.line([(196, 500), (828, 500)], fill=GOLD_EDGE + (180,), width=6)
    for sx in range(250, 800, 70):
        draw.ellipse([sx - 7, 519, sx + 7, 533], fill=GOLD_HI)

    gem_r = [30, 34, 44, 34, 30]
    for (tx, ty), r, col in zip(tips, gem_r, GEMS):
        gem(draw, tx, ty - r * 0.15, r, col)
    for bx, col in [(352, GEMS[1]), (512, GEMS[2]), (672, GEMS[3])]:
        gem(draw, bx, 506, 30, col)

    # ---- Wordmark -------------------------------------------------------
    text_with_shadow(img, cx, 690, "Candy Kingdom", load_font(108),
                     fill=GOLD + (255,), stroke=TITLE_STROKE + (255,),
                     stroke_w=7, tracking=2)
    text_with_shadow(img, cx, 905, "CRUSH", load_font(216),
                     fill=PINK + (255,), stroke=PINK_STROKE + (255,),
                     stroke_w=12, tracking=10)

    os.makedirs(OUT_DIR, exist_ok=True)
    variants = {"logo_crown.png": 3, "logo_crown@2x.png": 1.5,
                "logo_crown@3x.png": 1}
    for name, factor in variants.items():
        size = (int(W / factor), int(H / factor))
        img.resize(size, Image.LANCZOS).save(os.path.join(OUT_DIR, name))
        print(f"wrote {name} ({size[0]}x{size[1]})")


if __name__ == "__main__":
    main()
