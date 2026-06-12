#!/usr/bin/env python3
"""
Wires the crown + wordmark logo into the NATIVE launch screens (shown during
cold start, before the JS bundle loads):

  iOS      ios/.../Images.xcassets/LaunchLogo.imageset/  (@1x/@2x/@3x + json)
  Android  android/.../res/drawable-*/splash_logo.png    (per-density)

The storyboard / theme XML that references these is committed separately.
Run AFTER generate_logo_crown.py.
Run:  python3 scripts/generate_splash.py
"""

import json
import os
import shutil

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "src", "assets", "images")
IOS_SET = os.path.join(
    ROOT, "ios", "CandyKingdomCrush", "Images.xcassets", "LaunchLogo.imageset"
)
ANDROID_RES = os.path.join(ROOT, "android", "app", "src", "main", "res")

# Android splash logo width (dp ~= mdpi px) per density bucket.
ANDROID = {"mdpi": 200, "hdpi": 300, "xhdpi": 400, "xxhdpi": 600,
           "xxxhdpi": 800}


def main():
    variants = {
        "logo_crown.png": "1x",
        "logo_crown@2x.png": "2x",
        "logo_crown@3x.png": "3x",
    }
    for name in variants:
        if not os.path.exists(os.path.join(IMG_DIR, name)):
            raise SystemExit(f"Missing {name} — run generate_logo_crown.py first.")

    # ---- iOS imageset --------------------------------------------------
    os.makedirs(IOS_SET, exist_ok=True)
    images = []
    for name, scale in variants.items():
        shutil.copyfile(os.path.join(IMG_DIR, name),
                        os.path.join(IOS_SET, name))
        images.append({"idiom": "universal", "filename": name, "scale": scale})
    with open(os.path.join(IOS_SET, "Contents.json"), "w") as f:
        json.dump({"images": images, "info": {"author": "xcode", "version": 1}},
                  f, indent=2)
    print("wrote iOS LaunchLogo.imageset")

    # ---- Android per-density splash logo -------------------------------
    src = Image.open(os.path.join(IMG_DIR, "logo_crown@3x.png")).convert("RGBA")
    ratio = src.height / src.width
    for dens, w in ANDROID.items():
        folder = os.path.join(ANDROID_RES, f"drawable-{dens}")
        os.makedirs(folder, exist_ok=True)
        h = round(w * ratio)
        src.resize((w, h), Image.LANCZOS).save(
            os.path.join(folder, "splash_logo.png"))
    print("wrote Android drawable-*/splash_logo.png x5")


if __name__ == "__main__":
    main()
