# 🍬 Candy Kingdom Crush

A colourful, fully **offline** Candy Crush–style **Match-3** puzzle game built with
**React Native CLI** (not Expo) and **TypeScript**. Match candies, trigger
chain-reaction cascades, craft special candies, smash through obstacles, and earn
stars across **20 handcrafted levels**.

No backend. No network. No accounts. Everything — progress, stars, best scores and
settings — is saved on-device with AsyncStorage.

---

## ✨ Features

- **8×8 board**, 6 candy types, random generation with **no initial matches**
- **Swipe to swap** adjacent candies; invalid moves animate and revert
- **Special candies**
  - Match 4 → **Striped** (clears a full row or column)
  - L/T shape → **Wrapped** (explodes a 3×3 area)
  - Match 5 → **Colour Bomb** (clears every candy of one colour)
- **Cascades**: gravity + top-spawn refills + chain reactions with a rising
  **combo multiplier**
- **Obstacles**: ❄️ ice (break it), 🔒 locked candies (free with a nearby match),
  🍫 chocolate (clear it before it spreads!)
- **20 levels** with increasing difficulty, per-level **move limits**, score/clear
  **objectives** and **1–3 star** ratings
- **Reanimated** animations: swap, pop, gravity fall, explosions, invalid shake,
  level-complete star pops, combo toasts
- **Zustand** global state, **AsyncStorage** offline persistence
- Clean, modular, **engine-separated-from-UI** architecture
- Zero binary assets required — candies are coloured tiles + emoji glyphs

---

## 🧱 Tech Stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Framework      | React Native CLI `0.76.5`                |
| Language       | TypeScript (strict)                      |
| State          | Zustand                                  |
| Navigation     | React Navigation (native-stack)          |
| Animation      | React Native Reanimated 3 + Gesture Handler |
| Persistence    | @react-native-async-storage/async-storage |
| Audio          | Placeholder service (drop-in ready)      |

---

## 📁 Project Structure

```
src/
├── components/      # Board, Candy, HUD, overlays, buttons, stars, combo toast
├── screens/         # Home, LevelSelect, Game, Settings
├── navigation/      # RootNavigator + route types
├── store/           # Zustand: gameStore, progressStore, settingsStore
├── game-engine/     # PURE game logic (no React):
│   ├── BoardGenerator.ts   # match-free boards + obstacle layout + reshuffle
│   ├── MatchDetector.ts    # run detection + special-candy spawn rules
│   ├── SwapValidator.ts    # legal swaps, color-bomb swaps, dead-board check
│   ├── GravityEngine.ts    # segment-based gravity + top refill
│   ├── CascadeEngine.ts    # orchestrates clear → specials → gravity → score
│   ├── PowerUpEngine.ts     # special blast areas + chocolate spreading
│   ├── LevelEngine.ts       # objectives, win/lose, star ratings
│   └── ScoreEngine.ts       # scoring + combo multipliers
├── hooks/           # useGameBoard (move orchestration), useSound
├── constants/       # board size, scoring, timings, theme, layout
├── levels/          # levels.json (20 levels) + typed loader
├── services/        # storage (AsyncStorage), audio (placeholders)
├── utils/           # grid helpers, formatting
├── types/           # shared domain types
└── assets/          # sounds/ + images/ placeholders (none required to run)
```

The **engine is 100% pure TypeScript** with no UI imports, so it can be unit
tested in isolation (`npm test`) and reused anywhere.

---

## 🚀 Getting Started

### Prerequisites

Follow the official **React Native CLI** environment setup
(<https://reactnative.dev/docs/set-up-your-environment>):

- Node ≥ 18
- JDK 17, Android Studio + an Android SDK / emulator (for Android)
- Xcode + CocoaPods + Ruby bundler (for iOS, macOS only)

### ⚠️ Important: move the project to a path WITHOUT spaces

React Native's Android (Gradle/NDK) and Metro tooling do not reliably handle
**spaces in the project path**. This project may have been generated inside a
folder like `untitled folder`. Before building, move it somewhere space-free, e.g.:

```bash
mv "CandyKingdomCrush" ~/CandyKingdomCrush
cd ~/CandyKingdomCrush
```

### 1. Install JS dependencies

```bash
npm install
```

### 2. Generate the native binary files (one time)

A code drop can include all *source* files but not a few **binary / generated**
native artifacts (the Gradle wrapper `.jar`, `gradlew`, the Android debug
keystore, raster launcher icons, and the iOS `.xcodeproj`). The included script
creates a throwaway RN 0.76.5 project and copies just those files in:

```bash
bash scripts/bootstrap-native.sh
```

> Already starting from a fresh `npx @react-native-community/cli init` project?
> Then you can skip the bootstrap and instead copy this repo's `src/`, `App.tsx`,
> `index.js`, `babel.config.js`, `app.json` and the config files over the generated
> project, and `npm install` the extra dependencies listed in `package.json`.

### 3. Run it

```bash
# Start Metro (in its own terminal)
npm start

# Android (device/emulator running)
npm run android

# iOS (macOS only)
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios
```

---

## 🎮 How to Play

- **Swipe** a candy up/down/left/right to swap it with its neighbour.
- A swap is only allowed if it **creates a match** (or uses a Colour Bomb).
- Clear candies to **reach the target score** and complete the level's
  **objective** before you run out of **moves**.
- Build **specials** and chain **cascades** for big combo multipliers.

| Match            | Result                                    |
| ---------------- | ----------------------------------------- |
| 3 in a line      | Clear (60 pts base)                       |
| 4 in a line      | Striped candy (clears a row/column)       |
| L / T shape      | Wrapped candy (3×3 explosion)             |
| 5 in a line      | Colour Bomb (clears a whole colour)       |

**Obstacles:** ❄️ break ice with nearby matches · 🔒 free locked candies by
matching beside them · 🍫 clear chocolate before it spreads each turn.

---

## 🧠 Architecture Notes

- **Engine ↔ UI separation.** All rules live in `src/game-engine` as pure
  functions returning new boards + event metadata. The UI never mutates the board
  directly.
- **Move orchestration.** `useGameBoard` runs each move:
  `swipe → validate → animate swap → (revert if invalid) → CascadeEngine.resolveBoard
  → play steps with timed delays → spread chocolate → evaluate win/lose/reshuffle`.
- **Animation strategy.** Each `Candy` is keyed by a **stable id** and positioned
  by Reanimated shared values, so swaps and gravity falls animate automatically as
  its row/col change. Cleared candies are flagged "popping" (scale+fade) before the
  board state unmounts them; new candies fall in from the top.
- **Scoring** lives in `ScoreEngine`; combo multipliers ramp per cascade step.
- **Persistence**: `progressStore` and `settingsStore` read/write JSON via
  `services/storage.ts` (AsyncStorage). Only level 1 is unlocked initially; winning
  unlocks the next.

---

## 🔊 Audio

The game ships **without** bundled audio (so it installs cleanly and stays
offline). `src/services/audio.ts` is a stable, no-op `AudioService`. To enable
real sound, follow `src/assets/sounds/README.md` — install `react-native-sound`,
drop in the listed files, and implement the three play methods. No other code
changes are required.

---

## 📜 Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm start`        | Start the Metro bundler              |
| `npm run android`  | Build & run on Android               |
| `npm run ios`      | Build & run on iOS                   |
| `npm test`         | Run the engine unit tests (Jest)     |
| `npm run tsc`      | Type-check the project               |
| `npm run lint`     | Lint                                 |

---

## 🛠️ Troubleshooting

- **Build fails with weird path errors** → ensure the project path has **no
  spaces** (see above).
- **`gradlew: No such file` / signing errors** → run `bash scripts/bootstrap-native.sh`
  to fetch the Gradle wrapper + debug keystore.
- **Reanimated errors / "Failed to create a worklet"** → confirm
  `react-native-reanimated/plugin` is the **last** plugin in `babel.config.js`,
  then restart Metro with `npm start --reset-cache`.
- **Gestures don't work** → `index.js` imports `react-native-gesture-handler`
  first, and `App.tsx` wraps everything in `GestureHandlerRootView` (both already
  set up here).
- **iOS pods** → `cd ios && bundle exec pod install`.

---

## 📄 License

MIT — do whatever you like. Built as a complete, production-style reference for an
offline React Native match-3 game.
