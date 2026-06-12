#!/usr/bin/env python3
"""
Generates the Candy Kingdom Crush text wordmark as a transparent PNG using
Pillow — the stacked "Candy Kingdom / CRUSH" title (the game name), no crown.

Outputs src/assets/images/logo_wordmark.png (and @2x/@3x density variants).
Run:  python3 scripts/generate_logo_wordmark.py
"""

import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "src", "assets", "images")

W, H = 1024, 540

# Colours tuned to read on a light/white background.
GOLD = (247, 168, 0)         # "Candy Kingdom" fill
TITLE_STROKE = (74, 42, 8)   # warm brown outline (no violet)
PINK = (255, 61, 133)        # "CRUSH" fill
PINK_STROKE = (150, 28, 74)  # deep magenta outline

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


def text_with_shadow(base, center_x, center_y, text, font, fill, stroke,
                     stroke_w, tracking=0):
    """Draw letter-spaced text with a soft drop shadow, centred at (cx, cy)."""
    advances = [font.getlength(ch) for ch in text]
    total = sum(advances) + tracking * (len(text) - 1)
    ascent, descent = font.getmetrics()
    top = center_y - (ascent + descent) / 2

    # Shadow layer.
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    x = center_x - total / 2
    for ch, adv in zip(text, advances):
        sd.text((x, top + 10), ch, font=font, fill=(0, 0, 0, 150),
                stroke_width=stroke_w, stroke_fill=(0, 0, 0, 150))
        x += adv + tracking
    shadow = shadow.filter(ImageFilter.GaussianBlur(9))
    base.alpha_composite(shadow)

    # Foreground letters.
    fg = ImageDraw.Draw(base)
    x = center_x - total / 2
    for ch, adv in zip(text, advances):
        fg.text((x, top), ch, font=font, fill=fill,
                stroke_width=stroke_w, stroke_fill=stroke)
        x += adv + tracking


def main():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cx = W / 2

    text_with_shadow(img, cx, 130, "Candy Kingdom", load_font(108),
                     fill=GOLD + (255,), stroke=TITLE_STROKE + (255,),
                     stroke_w=7, tracking=2)
    text_with_shadow(img, cx, 360, "CRUSH", load_font(216),
                     fill=PINK + (255,), stroke=PINK_STROKE + (255,),
                     stroke_w=12, tracking=10)

    os.makedirs(OUT_DIR, exist_ok=True)
    variants = {"logo_wordmark.png": 3, "logo_wordmark@2x.png": 1.5,
                "logo_wordmark@3x.png": 1}
    for name, factor in variants.items():
        size = (int(W / factor), int(H / factor))
        img.resize(size, Image.LANCZOS).save(os.path.join(OUT_DIR, name))
        print(f"wrote {name} ({size[0]}x{size[1]})")


if __name__ == "__main__":
    main()
