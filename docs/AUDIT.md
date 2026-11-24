# Cubora Android Release Audit

## Scope

This audit covers the Flutter shell, bundled offline game, Android packaging configuration, privacy posture, and Google Play release assets.

## Offline and privacy

- The game and its world images are bundled under `assets/game/` and `assets/branding/`.
- The app does not request network access, storage access, location, contacts, microphone, camera, or advertising identifiers.
- Scores and other game preferences are stored locally in the device's browser/webview storage.
- No analytics, advertising SDK, account system, payment SDK, or third-party data collection is included.

## Android configuration

- Generate the Android project with `dart run tool/setup.dart --org <PACKAGE_ORG>`.
- The setup script configures the permanent application ID as `<PACKAGE_ORG>.cubora`.
- Release signing must be supplied through `android/key.properties`.
- Target Android API 36 or the latest API required by current Google Play policy.
- Keep release keystores outside the repository and never commit `key.properties` or `.jks` files.

## WebView bridge

- JavaScript is restricted to the bundled `assets/game/index.html` asset.
- Haptic requests are handled through the `CuboraBridge` JavaScript channel.
- The app pauses and resumes game audio/timers with the bundled lifecycle hooks.
- Back navigation is delegated to `window.__cuboraBack()` before the native quit dialog is shown.

## Release checks

1. Replace `com.yourname` in `codemagic.yaml` with the permanent package organization.
2. Replace the Codemagic notification address.
3. Generate and protect the Android upload keystore.
4. Run `flutter pub get`, `dart format`, `flutter analyze`, and `flutter test`.
5. Build and install the release APK on a physical Android device.
6. Verify portrait layout, haptics, audio lifecycle, back navigation, and quit confirmation.
7. Build the app bundle and perform an internal or closed test before production.
8. Complete Google Play Data safety and privacy policy declarations using `store/play_console_answers.md`.
