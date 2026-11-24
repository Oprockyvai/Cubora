# Play Console — Suggested Answers (Block Clash)

Always verify every Play Console form question yourself before final submission.

## Store Settings
* App or game: **Game** — Category **Puzzle** — Free.

## App Content
| Section | Suggested Answer |
|---|---|
| Privacy policy | Host and link `store/privacy_policy.html` on a public HTTPS URL |
| Ads | **No, my app does not contain ads** |
| App access | All functionality is available without sign-in or special access |
| Target audience | **13+** (or **18+**); choosing under-13 triggers Google Play Families policies |
| Content rating (IARC) | No violence, blood, sexual content, profanity, gambling, UGC, or location sharing -> Expected: **Everyone / PEGI 3** |
| News / COVID / Government / Financial / Health | **No** |

## Data Safety
* Does your app collect or share any user data types? **No**
  (Block Clash runs 100% offline with zero network calls; scores, settings, profile name/avatar, gems, and progress stay solely in local device storage.)
* Advertising ID declaration: Not used (**No**).
* In-app purchases: None.
* Special Android permissions: None required.

## Android Release Build Notes
* Target SDK: Configure Android packaging (`targetSdk` >= 35 / current Google Play policy requirement) with an immutable upload keystore (`key.properties`) kept outside source control.
* Note on Web-Container Environment: In environments without Flutter/Android SDK installed, build the verified production web bundle via `npm run build` (`dist/`) and package the `.aab` using your local Android Studio / Capacitor / Flutter-Android SDK toolchain before uploading to Play Console.
