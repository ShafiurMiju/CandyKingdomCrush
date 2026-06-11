# Image assets

Candies, specials and obstacles are drawn programmatically with coloured tiles +
emoji glyphs (see `src/components/Candy.tsx` and `src/constants/theme.ts`), so the
game needs **no bundled image files** to run.

If you want to swap the emoji glyphs for custom sprites, drop PNGs here and
replace the `<Text>` glyphs in `Candy.tsx` with `<Image>` components, mapping each
`CandyColor` / `SpecialKind` to its sprite.
