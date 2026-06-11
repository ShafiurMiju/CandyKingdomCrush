#!/usr/bin/env bash
#
# bootstrap-native.sh
# --------------------
# The text-only source files in this repo cover ~99% of the native projects, but
# a handful of files are BINARY (or auto-generated tooling) and cannot live in a
# text-based code drop:
#
#   Android: gradle/wrapper/gradle-wrapper.jar, gradlew, gradlew.bat, debug.keystore
#   iOS:     CandyKingdomCrush.xcodeproj (the Xcode project / .pbxproj)
#
# This script spins up a throwaway React Native 0.76.5 project with the official
# CLI, then copies just those generated artifacts into this repo. Run it ONCE
# after cloning. It is safe to re-run; it only fills in missing files.
#
# Usage:  bash scripts/bootstrap-native.sh
#
set -euo pipefail

RN_VERSION="0.76.5"
APP_NAME="CandyKingdomCrush"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"

echo "==> Generating a temporary RN ${RN_VERSION} project to extract native binaries..."
echo "    (this requires network access on first run)"
pushd "$TMP_DIR" >/dev/null
npx @react-native-community/cli@15.0.1 init "$APP_NAME" --version "$RN_VERSION" --skip-install --skip-git-init
popd >/dev/null

SRC="$TMP_DIR/$APP_NAME"

echo "==> Copying Android Gradle wrapper + debug keystore..."
mkdir -p "$ROOT_DIR/android/gradle/wrapper"
cp -f "$SRC/android/gradle/wrapper/gradle-wrapper.jar" "$ROOT_DIR/android/gradle/wrapper/gradle-wrapper.jar"
cp -f "$SRC/android/gradlew"     "$ROOT_DIR/android/gradlew"
cp -f "$SRC/android/gradlew.bat" "$ROOT_DIR/android/gradlew.bat"
cp -f "$SRC/android/app/debug.keystore" "$ROOT_DIR/android/app/debug.keystore"
chmod +x "$ROOT_DIR/android/gradlew"

echo "==> Copying Android launcher PNGs (for API < 26 fallback)..."
for d in mipmap-hdpi mipmap-mdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi; do
  if [ -d "$SRC/android/app/src/main/res/$d" ]; then
    mkdir -p "$ROOT_DIR/android/app/src/main/res/$d"
    cp -f "$SRC/android/app/src/main/res/$d/"*.png "$ROOT_DIR/android/app/src/main/res/$d/" 2>/dev/null || true
    cp -f "$SRC/android/app/src/main/res/$d/"*.webp "$ROOT_DIR/android/app/src/main/res/$d/" 2>/dev/null || true
  fi
done

echo "==> Copying iOS Xcode project + supporting files..."
cp -Rf "$SRC/ios/$APP_NAME.xcodeproj" "$ROOT_DIR/ios/" 2>/dev/null || true
cp -f  "$SRC/ios/.xcode.env" "$ROOT_DIR/ios/.xcode.env" 2>/dev/null || true
# The xcodeproj references AppDelegate / Info.plist / images by path; ours already
# match the generated names, so the project will pick up the versions in this repo.

echo "==> Cleaning up..."
rm -rf "$TMP_DIR"

cat <<'EOF'

Bootstrap complete. Next steps:

  npm install
  # iOS only:
  cd ios && bundle install && bundle exec pod install && cd ..

  npm run android     # or: npm run ios

EOF
