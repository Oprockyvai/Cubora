# Play Console - suggested answers

Always check the forms yourself: Google's questions change, and you are the one who confirms them.

## Store settings
* App or game: **Game** - Category **Puzzle** - Free.

## App content
| Section | Suggested answer |
|---|---|
| Privacy policy | URL of your hosted `privacy_policy.html` |
| Ads | **No, my app does not contain ads** |
| App access | All functionality available without login / special access |
| Target audience | **13+** (or 18+). Choosing "under 13" triggers the stricter Families policy - only do this on purpose |
| Content rating (IARC) | Answer honestly: no violence, no blood, no sexual content, no profanity, no gambling, no user-generated content, no sharing of location. Expected result: **Everyone / PEGI 3** |
| News app / COVID / Government | No |
| Financial features / Health | No |

## Data safety
* Does your app collect or share any of the required user data types? **No**
  (Cubora has no network access; game progress is stored only on the device and never leaves it.)
* Data encrypted in transit / deletion request: not applicable when no data is collected.
* If you later add ads, analytics, crash reporting or cloud save, update this form **and** the privacy policy before releasing.

## Declarations
* In-app purchases: none. Permissions: none. Advertising ID: not used (select "No" when asked).
* Government apps / Financial / Health: No.

## Release
* Production release uses the `.aab` from `flutter build appbundle --release`.
* New personal developer accounts: complete the closed test (12 testers, 14 days) first - see README.
