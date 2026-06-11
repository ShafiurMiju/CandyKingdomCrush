# Sound assets (placeholders)

The game ships **without** bundled audio so it installs cleanly and stays fully
offline. `AudioService` (`src/services/audio.ts`) exposes a stable API whose
calls are currently silent no-ops.

To add real audio:

1. Install a player: `npm i react-native-sound`
   (Android: no extra steps; iOS: `cd ios && pod install`).
2. Drop the following files here:

   | Key       | File           | When it plays              |
   | --------- | -------------- | -------------------------- |
   | match     | `match.mp3`    | a normal match clears      |
   | combo     | `combo.mp3`    | cascade combo (x3+)        |
   | special   | `special.mp3`  | a special candy detonates  |
   | swap      | `swap.mp3`     | candies are swapped        |
   | invalid   | `invalid.mp3`  | an illegal swap is tried   |
   | menu BGM  | `bgm_menu.mp3` | home / level select music  |
   | game BGM  | `bgm_game.mp3` | in-level music             |
   | win       | `win.mp3`      | level complete             |
   | lose      | `lose.mp3`     | out of moves               |

3. Implement `load()` / `playEffect()` / `playMusic()` inside
   `src/services/audio.ts`. The rest of the app already calls these methods, so
   no other changes are needed.

File names are also declared in `SOUND_FILES` / `MUSIC_FILES` in `audio.ts`.
