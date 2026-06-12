#!/usr/bin/env python3
"""
Generates the app launcher icons from the candy-swirl emblem (logo@3x.png),
composited onto a themed purple background, for both platforms:

  iOS      ios/CandyKingdomCrush/Images.xcassets/AppIcon.appiconset/Icon-1024.png
  Android  mipmap-*/ic_launcher.png + ic_launcher_round.png   (legacy, full-bleed)
           mipmap-*/ic_launcher_foreground.png                (adaptive foreground)

Run AFTER generate_logo.py (it consumes logo@3x.png).
Run:  python3 scripts/generate_icons.py
"""

import math
import os

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "src", "assets", "images")
IOS_ICON_DIR = os.path.join(
    ROOT, "ios", "CandyKingdomCrush", "Images.xcassets", "AppIcon.appiconset"
)
ANDROID_RES = os.path.join(ROOT, "android", "app", "src", "main", "res")

# Theme palette (mirrors src/constants/theme.ts).
BG_TOP = (78, 49, 170)     # palette.bgBottom (lighter, top of gradient)
BG_BOT = (46, 11, 110)     # palette.panel    (darker, bottom)
GLOW = (123, 78, 200)

# Android launcher icon densities.
LEGACY = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
ADAPTIVE = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324,
            "xxxhdpi": 432}


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def gradient_bg(size):
    """Vertical purple gradient with a soft radial glow in the centre."""
    bg = Image.new("RGB", (size, size))
    d = ImageDraw.Draw(bg)
    for y in range(size):
        d.line([(0, y), (size, y)], fill=lerp(BG_TOP, BG_BOT, y / size))
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    r = size * 0.42
    gd.ellipse([size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r],
               fill=GLOW + (120,))
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.10))
    bg = bg.convert("RGBA")
    bg.alpha_composite(glow)
    return bg


def composite_emblem(emblem, size, scale):
    """Centre the emblem at `scale` of `size` over a gradient background."""
    bg = gradient_bg(size)
    d = int(size * scale)
    em = emblem.resize((d, d), Image.LANCZOS)
    off = (size - d) // 2
    bg.alpha_composite(em, (off, off))
    return bg


def circle_mask(size):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).ellipse([0, 0, size - 1, size - 1], fill=255)
    return m


def main():
    src = os.path.join(IMG_DIR, "logo@3x.png")
    if not os.path.exists(src):
        raise SystemExit("Missing logo@3x.png — run generate_logo.py first.")
    emblem = Image.open(src).convert("RGBA")

    # ---- iOS 1024 (opaque, no alpha) -----------------------------------
    ios = composite_emblem(emblem, 1024, 0.82).convert("RGB")
    os.makedirs(IOS_ICON_DIR, exist_ok=True)
    ios.save(os.path.join(IOS_ICON_DIR, "Icon-1024.png"))
    print("wrote iOS Icon-1024.png")

    # ---- Android legacy square + round ---------------------------------
    master = composite_emblem(emblem, 512, 0.82)
    for dens, px in LEGACY.items():
        folder = os.path.join(ANDROID_RES, f"mipmap-{dens}")
        os.makedirs(folder, exist_ok=True)
        sq = master.resize((px, px), Image.LANCZOS)
        sq.convert("RGB").save(os.path.join(folder, "ic_launcher.png"))
        rnd = sq.copy()
        rnd.putalpha(circle_mask(px))
        rnd.save(os.path.join(folder, "ic_launcher_round.png"))
    print("wrote Android legacy ic_launcher(.round).png x5")

    # ---- Android adaptive foreground (emblem only, safe-zone inset) -----
    for dens, px in ADAPTIVE.items():
        folder = os.path.join(ANDROID_RES, f"mipmap-{dens}")
        os.makedirs(folder, exist_ok=True)
        fg = Image.new("RGBA", (px, px), (0, 0, 0, 0))
        d = int(px * 0.66)  # keep emblem inside the 66dp adaptive safe zone
        em = emblem.resize((d, d), Image.LANCZOS)
        fg.alpha_composite(em, ((px - d) // 2, (px - d) // 2))
        fg.save(os.path.join(folder, "ic_launcher_foreground.png"))
    print("wrote Android adaptive ic_launcher_foreground.png x5")


if __name__ == "__main__":
    main()
