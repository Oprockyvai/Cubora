/// Pure (platform-free) ad rules, kept separate from the SDK so they can be unit tested.
library;

/// Result reported back to the game for a rewarded request.
enum AdOutcome { rewarded, closed, failed }

/// A request coming from the game page through the `CuboraBridge` JS channel.
///
///  * `ad:query`                 - game asks for the current ad availability
///  * `ad:rewarded:<requestId>`  - show a rewarded ad
///  * `ad:interstitial`          - game over opportunity for an interstitial
///  * `ad:privacy`               - open the privacy / ad choices form
sealed class AdMessage {
  const AdMessage();

  static final RegExp _id = RegExp(r'^[A-Za-z0-9_]{1,32}$');

  /// Returns `null` for anything that is not a well-formed ad message
  /// (the request id is echoed into JavaScript, so it is strictly validated).
  static AdMessage? parse(String raw) {
    if (!raw.startsWith('ad:')) return null;
    final parts = raw.substring(3).split(':');
    switch (parts.first) {
      case 'query':
        return parts.length == 1 ? const AdQuery() : null;
      case 'privacy':
        return parts.length == 1 ? const AdPrivacy() : null;
      case 'interstitial':
        return parts.length == 1 ? const AdInterstitial() : null;
      case 'rewarded':
        if (parts.length == 2 && _id.hasMatch(parts[1])) {
          return AdRewarded(parts[1]);
        }
        return null;
      default:
        return null;
    }
  }
}

final class AdQuery extends AdMessage {
  const AdQuery();
}

final class AdInterstitial extends AdMessage {
  const AdInterstitial();
}

final class AdPrivacy extends AdMessage {
  const AdPrivacy();
}

final class AdRewarded extends AdMessage {
  const AdRewarded(this.requestId);
  final String requestId;
}

/// Decides when a game-over interstitial may be shown: every [every]-th
/// opportunity, and never sooner than [minGap] after any other full-screen ad.
class InterstitialPolicy {
  InterstitialPolicy({
    this.every = 3,
    this.minGap = const Duration(seconds: 120),
  }) : assert(every >= 1);

  final int every;
  final Duration minGap;

  int _opportunities = 0;
  DateTime? _lastFullScreen;

  /// Call for every game-over opportunity. Returns `true` if an ad may be shown now.
  bool shouldShow(DateTime now) {
    _opportunities++;
    if (_opportunities % every != 0) return false;
    final last = _lastFullScreen;
    if (last != null && now.difference(last) < minGap) {
      // Too soon: keep the slot, so the next opportunity is eligible again.
      _opportunities--;
      return false;
    }
    return true;
  }

  /// Call whenever any full-screen ad (rewarded or interstitial) was shown.
  void markShown(DateTime now) => _lastFullScreen = now;
}
