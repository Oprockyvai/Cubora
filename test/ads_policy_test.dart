import 'package:cubora/core/ads_policy.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AdMessage.parse', () {
    test('parses valid messages', () {
      expect(AdMessage.parse('ad:query'), isA<AdQuery>());
      expect(AdMessage.parse('ad:interstitial'), isA<AdInterstitial>());
      expect(AdMessage.parse('ad:privacy'), isA<AdPrivacy>());
      final r = AdMessage.parse('ad:rewarded:r_12');
      expect(r, isA<AdRewarded>());
      expect((r! as AdRewarded).requestId, 'r_12');
    });

    test('rejects malformed or unsafe messages', () {
      expect(AdMessage.parse('h:20'), isNull);
      expect(AdMessage.parse('ad:'), isNull);
      expect(AdMessage.parse('ad:rewarded'), isNull);
      expect(AdMessage.parse('ad:rewarded:'), isNull);
      expect(AdMessage.parse('ad:rewarded:a"b'), isNull);
      expect(AdMessage.parse('ad:rewarded:a;alert(1)'), isNull);
      expect(AdMessage.parse('ad:rewarded:a:b'), isNull);
      expect(AdMessage.parse('ad:query:x'), isNull);
      expect(AdMessage.parse('ad:privacy:x'), isNull);
      expect(AdMessage.parse('ad:unknown'), isNull);
    });
  });

  group('InterstitialPolicy', () {
    test('shows on every Nth opportunity', () {
      final p = InterstitialPolicy(every: 3);
      final t = DateTime(2026, 1, 1);
      expect(p.shouldShow(t), isFalse);
      expect(p.shouldShow(t), isFalse);
      expect(p.shouldShow(t), isTrue);
    });

    test('respects minimum gap after another full-screen ad', () {
      final p = InterstitialPolicy(every: 1, minGap: const Duration(seconds: 120));
      final t = DateTime(2026, 1, 1);
      expect(p.shouldShow(t), isTrue);
      p.markShown(t);
      expect(p.shouldShow(t.add(const Duration(seconds: 30))), isFalse);
      expect(p.shouldShow(t.add(const Duration(seconds: 121))), isTrue);
    });
  });
}
