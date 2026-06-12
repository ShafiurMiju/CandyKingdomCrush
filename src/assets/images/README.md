# Image assets

`candykingdom.jpg` is the full-screen background artwork used on every screen
via `src/components/AppBackground.tsx` (an `ImageBackground` with a translucent
**white** scrim that brightens the art for the light theme). `candykingdom.png`
is the original source file — the app bundles only the optimised JPEG. To
refresh it after changing the PNG:

```sh
sips -s format jpeg -s formatOptions 75 src/assets/images/candykingdom.png \
  --out src/assets/images/candykingdom.jpg
```

Candies, specials and obstacles are still drawn programmatically with coloured
tiles + emoji glyphs (see `src/components/Candy.tsx` and
`src/constants/theme.ts`). If you want to swap the emoji glyphs for custom
sprites, drop PNGs here and replace the `<Text>` glyphs in `Candy.tsx` with
`<Image>` components, mapping each `CandyColor` / `SpecialKind` to its sprite.

## Logos & app icons (generated)

These are produced from Python + Pillow scripts, so they regenerate
deterministically — never hand-edit the PNGs, edit the script and re-run.

- `logo.png` / `@2x` / `@3x` — candy-swirl emblem (gold coin + peppermint
  swirl), used only as the source for the app launcher icons. Generator:
  `python3 scripts/generate_logo.py`.
- `logo_wordmark.png` / `@2x` / `@3x` — the "Candy Kingdom CRUSH" text
  wordmark, shown on the Home screen. Generator:
  `python3 scripts/generate_logo_wordmark.py`.
- `logo_crown.png` / `@2x` / `@3x` — crown + "Candy Kingdom CRUSH" wordmark,
  shown on the native launch screen. Generator:
  `python3 scripts/generate_logo_crown.py`.

The app launcher icons are built from `logo@3x.png` on a purple gradient by
`python3 scripts/generate_icons.py` (run `generate_logo.py` first). It writes:

- iOS — `ios/.../AppIcon.appiconset/Icon-1024.png`
- Android legacy — `mipmap-*/ic_launcher.png` + `ic_launcher_round.png`
- Android adaptive — `mipmap-*/ic_launcher_foreground.png` (the purple
  background stays in `drawable/ic_launcher_background.xml`)

The app display name ("Candy Kingdom Crush") lives in
`ios/CandyKingdomCrush/Info.plist` (`CFBundleDisplayName`) and
`android/app/src/main/res/values/strings.xml` (`app_name`).

### Native launch screen

The crown logo shows on the native cold-start splash (before the JS bundle
loads). `python3 scripts/generate_splash.py` copies it into the native asset
locations from `logo_crown@3x.png`:

- iOS — `ios/.../Images.xcassets/LaunchLogo.imageset`, displayed by
  `LaunchScreen.storyboard` (centred image on the light background).
- Android — `drawable-*/splash_logo.png`, centred by
  `drawable/splash_screen.xml`, set as `android:windowBackground` on `AppTheme`
  in `values/styles.xml`.

This native launch screen is the only splash — the app opens straight to the
Home screen once React Native has mounted (no extra in-app splash route).
