# Play Console — Suggested Answers (Block Clash)

Always verify every Play Console form question yourself before final submission.

## Store Settings
* App or game: **Game** — Category **Puzzle** — Free.

## App Content
| Section | Suggested Answer |
|---|---|
| Privacy policy | Host and link `store/privacy_policy.html` on a public HTTPS URL |
| Ads | **Yes, my app contains ads** (optional rewarded ads + occasional interstitials via AdMob with Unity Ads mediation) |
| App access | All functionality is available without sign-in or special access |
| Target audience | **13+** (or **18+**); choosing under-13 triggers Google Play Families policies |
| Content rating (IARC) | No violence, blood, sexual content, profanity, gambling, UGC, or location sharing -> Expected: **Everyone / PEGI 3** |
| News / COVID / Government / Financial / Health | **No** |

## Data Safety
* Does your app collect or share any user data types? **Yes** - collected/shared by the advertising SDKs (Google AdMob; Unity Ads through mediation), purpose: **Advertising or marketing** (and Analytics/Fraud prevention as declared by the SDKs).
  Declare at least: **Device or other IDs** (Advertising ID), **App activity -> App interactions**, **App info and performance -> Diagnostics**, **Approximate location** (derived from IP). Game data (scores, settings, profile, gems, progress) still stays only on the device.
  Re-check this list against the current "Google Mobile Ads SDK" and "Unity Ads" data disclosure guidance before submitting.
* Advertising ID declaration: **Yes** - used for advertising (the `com.google.android.gms.permission.AD_ID` permission is merged by the ads SDK).
* Target audience / Families: if the audience includes under-13s, ads must follow Google Play Families policy and `ADS_CHILD_DIRECTED` must be set to `true` in `codemagic.yaml`; the Unity dashboard child-directed setting must match.
* In-app purchases: None.
* Special Android permissions: `INTERNET`, `ACCESS_NETWORK_STATE`, `AD_ID` (all used only by the ads SDKs).

## Android Release Build Notes
* Target SDK: Configure Android packaging (`targetSdk` >= 35 / current Google Play policy requirement) with an immutable upload keystore (`key.properties`) kept outside source control.
* Note on Web-Container Environment: In environments without Flutter/Android SDK installed, build the verified production web bundle via `npm run build` (`dist/`) and package the `.aab` using your local Android Studio / Capacitor / Flutter-Android SDK toolchain before uploading to Play Console.
