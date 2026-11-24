# Cubora - Flutter app (Google Play ready)

Cubora's game (bundled HTML5, 100% offline) wrapped in a professional Flutter shell:

| Feature | Details |
|---|---|
| Offline | Game + 4 world images ship inside the app. No permissions, no INTERNET, no ads, no tracking. |
| Native feel | Edge-to-edge UI, themed system bars, branded splash (Android 12+ splash API), adaptive + themed (monochrome) launcher icon. |
| Back button | Smart: closes panels -> level map -> menu -> "Quit Cubora?" dialog. Works with Android 13+/16 predictive back. |
| Haptics | Game vibration events are routed to native Flutter haptics (no VIBRATE permission needed). |
| Battery & sound | Music, audio and the timer-mode clock pause when the app goes to the background. |
| Save data | Progress, gems, themes and scores are kept in on-device storage. |
| Release ready | Release signing, Play Store listing text, icon, feature graphic, screenshots, privacy policy. |

```
lib/            Flutter source (main, app, core/, ui/)
assets/game/    The game (index.html + img/) and its native-bridge script
assets/branding Logo used by the native shell
android_overlay Android config applied on top of `flutter create` (manifest, themes, splash, icons)
tool/setup.dart One-command setup
store/          Everything you need for the Play Console listing
```

## Quick start (Bangla)
1. Flutter install koro (stable) + Android Studio (Android SDK).
2. `dart run tool/setup.dart --org com.tomarnam`  (package name ta Play Store e pore **ar bodlano jay na**, soja kore likho. Jemon `com.rahim.cubora`)
3. Phone USB debugging on kore `flutter run`.
4. Signing key banao (niche "Signing key"), tarpor `flutter build appbundle --release`.
5. `build/app/outputs/bundle/release/app-release.aab` file ta Play Console e upload koro.

## 1. Requirements
* Flutter **latest stable** (`flutter upgrade`) + Android SDK. Run `flutter doctor` and fix anything red.
* Google Play requires new apps and updates to target **Android 16 (API 36)** (since 31 Aug 2026).
  A current Flutter stable does this by default. After setup, open `android/app/build.gradle(.kts)`:
  if `targetSdk` is lower than 36, set `targetSdk = 36` (and make sure `compileSdk` is 36 or higher).

## 2. One-time setup
```bash
dart run tool/setup.dart --org com.yourname
```
This creates `android/` for your Flutter version, applies the Cubora overlay, wires release signing and runs `flutter pub get`.
The final package name is `<org>.cubora` (e.g. `com.yourname.cubora`). **It is permanent on Google Play.**

Try it: `flutter run` (phone connected, USB debugging on).

## 3. Signing key (do this once, keep it safe)
```bash
keytool -genkey -v -keystore upload-keystore.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```
Save the `.jks` file **outside** the project and back it up (password manager / cloud drive).
Then copy `android/key.properties.example` to `android/key.properties` and fill it in (`storeFile` = full path to the `.jks`).
Both files are git-ignored. Use Play App Signing (default in Play Console): Google keeps the final app-signing key, you only hold the *upload* key, so a lost upload key can be reset.

*Manual fallback if setup printed "[!] ... add signing manually":* follow
https://docs.flutter.dev/deployment/android#sign-the-app and use the values from `key.properties`.

## 4. Build
```bash
flutter build appbundle --release      # for Google Play  -> build/app/outputs/bundle/release/app-release.aab
flutter build apk --release            # optional: APK to share/test directly
```
Every new upload needs a higher build number: edit `version: 1.0.0+1` in `pubspec.yaml` -> `1.0.1+2`.

## 5. Publish on Google Play
Need a Play Console developer account (one-time fee + identity verification). Then:

1. **Create app** - name `Cubora: Block Puzzle`, Game, Free.
2. **Store listing** - paste texts from `store/listing_en.md`; upload `store/play_icon_512.png`, `store/feature_graphic_1024x500.png` and the 4 phone screenshots in `store/screenshots/`.
3. **Privacy policy** - host `store/privacy_policy.html` (GitHub Pages is free), fill your email in it, paste the URL.
4. **App content** - follow `store/play_console_answers.md` (data safety, content rating, ads, target audience).
5. **Test first**: if your *personal* developer account was created after 13 Nov 2023, Google requires a **closed test with at least 12 testers opted-in for 14 continuous days** before you can apply for production access. Start this early: Testing -> Closed testing -> upload the `.aab` -> add testers (Google Group / emails) -> they must opt in and keep it. (Organisation accounts are exempt.) Use *Internal testing* for quick checks (does not count toward the 14 days).
6. **Production** - after the closed test, apply for production access, then create a production release with the same `.aab` (or a newer one) and submit for review.

## Building with Codemagic (no local Flutter needed)
`codemagic.yaml` is included. It runs `tool/setup.dart`, signs the app with your Codemagic keystore and produces the `.aab` (for Play) and an `.apk` (for testing on your phone).

1. Put this project in a **GitHub / GitLab / Bitbucket** repository (private is fine). The `android/` folder is NOT needed in the repo - Codemagic generates it.
2. In `codemagic.yaml` set `PACKAGE_ORG` (e.g. `com.rahim`) and your email.
3. Codemagic -> **Add application** -> pick the repo -> choose **"Flutter App"** and use the **codemagic.yaml** configuration.
4. Codemagic -> Teams -> Code signing identities -> **Android keystores** -> *Generate keystore*, reference name **`cubora_upload_key`**, alias `upload`. Save the keystore file + passwords somewhere safe.
5. **Start new build** (branch `main`, workflow `Cubora Android Release`). When it is green, download `app-release.aab` and `app-release.apk` from *Artifacts*.
6. Install the `.apk` on your phone to test, then upload the `.aab` to Play Console (first release must be uploaded manually).

Keep `PACKAGE_ORG` the same for every build. Build numbers come from Codemagic (`$BUILD_NUMBER`) and always increase, as Play requires.

Optional automatic publishing: Google Cloud service account with Play Console API access -> add its JSON key to a Codemagic environment group `google_play` as `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` -> uncomment the `google_play` block in `codemagic.yaml`. Docs: https://docs.codemagic.io/yaml-publishing/google-play/

## 6. Updating the game later
Edit `assets/game/index.html` (keep the `<script id="cubora-native">` block at the end), bump `version` in `pubspec.yaml`, rebuild, upload.

## Notes
* The game's "Continue" button costs gems (earned by playing). There are no ads or purchases. If you add AdMob / in-app purchases later, update the Data safety form and the privacy policy first.
* On Android 16, tablets/foldables may rotate the app even though it is portrait-first; the game layout is centred and adapts.
* Fonts: the game uses the system font (Roboto on Android) as its design fallback. To ship a custom font, add it under `assets/game/` and reference it with `@font-face` in `index.html`.
