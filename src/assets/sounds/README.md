# Sound assets

Generated chiptune-style WAVs played via `react-native-sound`
(`AudioService` in `src/services/audio.ts`).

| Key      | File           | When it plays             |
| -------- | -------------- | ------------------------- |
| swap     | `swap.wav`     | candies are swapped       |
| match    | `match.wav`    | a normal match clears     |
| combo    | `combo.wav`    | cascade combo (x3+)       |
| special  | `special.wav`  | a special candy detonates |
| invalid  | `invalid.wav`  | an illegal swap is tried  |
| menu BGM | `bgm_menu.wav` | home / level select music (loops) |
| game BGM | `bgm_game.wav` | in-level music (loops)    |
| win      | `win.wav`      | level complete (stinger)  |
| lose     | `lose.wav`     | out of moves (stinger)    |

These files are the single source of truth, referenced directly by the Xcode
project (Sounds group) and mirrored into `android/app/src/main/res/raw/`.

To tweak or regenerate everything (synthesised offline, no licensing):

```sh
python3 scripts/generate_sounds.py
```

To replace a sound with a real recording, overwrite the `.wav` here AND in
`android/app/src/main/res/raw/` (same filename), then rebuild the app.
File names are declared in `SOUND_FILES` / `MUSIC_FILES` in `audio.ts`.
