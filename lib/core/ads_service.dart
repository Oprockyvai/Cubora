import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import 'ads_policy.dart';

/// Build-time ad configuration (override with `--dart-define=NAME=value`).
///
/// Ads are TEST ads unless the build is made with `--dart-define=ADS_TEST=false`.
/// Never click your own live ads: switch to live only for the Play Store release.
class AdsConfig {
  const AdsConfig._();

  static const bool useTestAds =
      bool.fromEnvironment('ADS_TEST', defaultValue: true);

  /// Set to `true` only if the Play Console target audience includes children.
  static const bool childDirected =
      bool.fromEnvironment('ADS_CHILD_DIRECTED', defaultValue: false);

  static const String _rewardedLive = String.fromEnvironment(
    'ADS_REWARDED_ID',
    defaultValue: 'ca-app-pub-4704475463086875/1762098134',
  );
  static const String _interstitialLive = String.fromEnvironment(
    'ADS_INTERSTITIAL_ID',
    defaultValue: 'ca-app-pub-4704475463086875/7369648033',
  );

  // Google's official sample units for Android.
  static const String _rewardedTest = 'ca-app-pub-3940256099942544/5224354917';
  static const String _interstitialTest =
      'ca-app-pub-3940256099942544/1033173712';

  static String get rewardedId => useTestAds ? _rewardedTest : _rewardedLive;
  static String get interstitialId =>
      useTestAds ? _interstitialTest : _interstitialLive;
}

typedef AdStateListener = void Function(bool rewardedReady, bool interstitialReady);

/// Owns the Mobile Ads SDK: consent, initialisation, preloading and showing.
/// Every failure is swallowed on purpose - the game must keep working offline.
class AdsService {
  AdsService._();
  static final AdsService instance = AdsService._();

  final InterstitialPolicy _policy = InterstitialPolicy();

  AdStateListener? onStateChanged;

  bool _started = false;
  bool _sdkReady = false;
  bool _showing = false;

  RewardedAd? _rewarded;
  InterstitialAd? _interstitial;
  bool _loadingRewarded = false;
  bool _loadingInterstitial = false;
  int _rewardedFailures = 0;
  int _interstitialFailures = 0;
  Timer? _rewardedRetry;
  Timer? _interstitialRetry;

  bool get rewardedReady => _rewarded != null && !_showing;
  bool get interstitialReady => _interstitial != null && !_showing;

  /// Gathers consent (GDPR/UMP), initialises the SDK and preloads the first ads.
  Future<void> start() async {
    if (kIsWeb || _started) return;
    _started = true;
    try {
      final canRequest = await _gatherConsent();
      if (!canRequest) return;
      await MobileAds.instance.updateRequestConfiguration(
        RequestConfiguration(
          tagForChildDirectedTreatment: AdsConfig.childDirected
              ? TagForChildDirectedTreatment.yes
              : TagForChildDirectedTreatment.unspecified,
          tagForUnderAgeOfConsent: AdsConfig.childDirected
              ? TagForUnderAgeOfConsent.yes
              : TagForUnderAgeOfConsent.unspecified,
          maxAdContentRating:
              AdsConfig.childDirected ? MaxAdContentRating.g : MaxAdContentRating.pg,
        ),
      );
      await MobileAds.instance.initialize();
      _sdkReady = true;
      _loadRewarded();
      _loadInterstitial();
    } catch (e) {
      debugPrint('Ads start failed: $e');
    }
  }

  Future<bool> _gatherConsent() {
    final done = Completer<bool>();
    Future<void> finish() async {
      if (done.isCompleted) return;
      try {
        done.complete(await ConsentInformation.instance.canRequestAds());
      } catch (_) {
        done.complete(false);
      }
    }

    try {
      ConsentInformation.instance.requestConsentInfoUpdate(
        ConsentRequestParameters(),
        () {
          ConsentForm.loadAndShowConsentFormIfRequired((error) {
            if (error != null) debugPrint('Consent form: ${error.message}');
            unawaited(finish());
          });
        },
        (error) {
          debugPrint('Consent info: ${error.message}');
          unawaited(finish());
        },
      );
    } catch (e) {
      debugPrint('Consent failed: $e');
      unawaited(finish());
    }
    return done.future;
  }

  void _notify() => onStateChanged?.call(rewardedReady, interstitialReady);

  Duration _backoff(int failures) =>
      Duration(seconds: math.min(60, 4 * math.pow(2, failures).toInt()));

  // ---------------------------------------------------------------- rewarded

  void _loadRewarded() {
    if (!_sdkReady || _loadingRewarded || _rewarded != null) return;
    _loadingRewarded = true;
    RewardedAd.load(
      adUnitId: AdsConfig.rewardedId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _loadingRewarded = false;
          _rewardedFailures = 0;
          _rewarded = ad;
          _notify();
        },
        onAdFailedToLoad: (error) {
          _loadingRewarded = false;
          _rewardedFailures++;
          debugPrint('Rewarded load failed: ${error.code} ${error.message}');
          _rewardedRetry?.cancel();
          _rewardedRetry = Timer(_backoff(_rewardedFailures), _loadRewarded);
        },
      ),
    );
  }

  /// Shows a rewarded ad. Resolves [AdOutcome.rewarded] only if the user earned it.
  Future<AdOutcome> showRewarded() {
    final ad = _rewarded;
    if (ad == null || _showing) {
      _loadRewarded();
      return Future.value(AdOutcome.failed);
    }
    _rewarded = null;
    _showing = true;
    _notify();

    final result = Completer<AdOutcome>();
    var earned = false;

    void complete(AdOutcome outcome) {
      if (result.isCompleted) return;
      _showing = false;
      _policy.markShown(DateTime.now());
      result.complete(outcome);
      _loadRewarded();
      _notify();
    }

    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        complete(earned ? AdOutcome.rewarded : AdOutcome.closed);
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        debugPrint('Rewarded show failed: ${error.message}');
        ad.dispose();
        complete(AdOutcome.failed);
      },
    );
    try {
      unawaited(ad.show(onUserEarnedReward: (adView, reward) => earned = true));
    } catch (e) {
      ad.dispose();
      complete(AdOutcome.failed);
    }
    return result.future;
  }

  // ------------------------------------------------------------ interstitial

  void _loadInterstitial() {
    if (!_sdkReady || _loadingInterstitial || _interstitial != null) return;
    _loadingInterstitial = true;
    InterstitialAd.load(
      adUnitId: AdsConfig.interstitialId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _loadingInterstitial = false;
          _interstitialFailures = 0;
          _interstitial = ad;
          _notify();
        },
        onAdFailedToLoad: (error) {
          _loadingInterstitial = false;
          _interstitialFailures++;
          debugPrint('Interstitial load failed: ${error.code} ${error.message}');
          _interstitialRetry?.cancel();
          _interstitialRetry =
              Timer(_backoff(_interstitialFailures), _loadInterstitial);
        },
      ),
    );
  }

  /// Game-over opportunity. Shows an interstitial only if the frequency policy
  /// allows it and one is ready. Returns `true` once the ad was closed/failed
  /// (or immediately `false` if nothing was shown).
  Future<bool> maybeShowInterstitial() {
    if (_showing || !_policy.shouldShow(DateTime.now())) {
      return Future.value(false);
    }
    final ad = _interstitial;
    if (ad == null) {
      _loadInterstitial();
      return Future.value(false);
    }
    _interstitial = null;
    _showing = true;
    _notify();

    final result = Completer<bool>();
    void complete(bool shown) {
      if (result.isCompleted) return;
      _showing = false;
      if (shown) _policy.markShown(DateTime.now());
      result.complete(shown);
      _loadInterstitial();
      _notify();
    }

    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        complete(true);
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        debugPrint('Interstitial show failed: ${error.message}');
        ad.dispose();
        complete(false);
      },
    );
    try {
      unawaited(ad.show());
    } catch (e) {
      ad.dispose();
      complete(false);
    }
    return result.future;
  }

  void dispose() {
    _rewardedRetry?.cancel();
    _interstitialRetry?.cancel();
    _rewarded?.dispose();
    _interstitial?.dispose();
    _rewarded = null;
    _interstitial = null;
  }
}
