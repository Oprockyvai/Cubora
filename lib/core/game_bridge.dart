import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// Strength of a haptic pulse requested by the game.
enum HapticLevel { none, tick, light, medium, heavy }

/// Talks to the "cubora-native" script that is part of assets/game/index.html.
///
///  * JS -> Flutter : `CuboraBridge.postMessage('h:<ms>')` (haptics)
///  * Flutter -> JS : `__cuboraBack()`, `__cuboraPause()`, `__cuboraResume()`
class GameBridge {
  GameBridge._();

  static const String channelName = 'CuboraBridge';

  /// Maps the game's `navigator.vibrate(ms)` duration to a native haptic level.
  static HapticLevel levelFor(int ms) {
    if (ms <= 0) return HapticLevel.none;
    if (ms <= 12) return HapticLevel.tick;
    if (ms <= 35) return HapticLevel.light;
    if (ms <= 70) return HapticLevel.medium;
    return HapticLevel.heavy;
  }

  /// Handles a message sent by the page through the JavaScript channel.
  static Future<void> onMessage(String message) async {
    if (!message.startsWith('h:')) return;
    final ms = int.tryParse(message.substring(2)) ?? 0;
    switch (levelFor(ms)) {
      case HapticLevel.none:
        return;
      case HapticLevel.tick:
        return HapticFeedback.selectionClick();
      case HapticLevel.light:
        return HapticFeedback.lightImpact();
      case HapticLevel.medium:
        return HapticFeedback.mediumImpact();
      case HapticLevel.heavy:
        return HapticFeedback.heavyImpact();
    }
  }

  /// `runJavaScriptReturningResult` returns `true`, `"true"` or `1` depending
  /// on the platform - normalise all of them.
  static bool parseBool(Object? value) {
    if (value == null) return false;
    if (value is bool) return value;
    if (value is num) return value != 0;
    final s = value.toString().trim().toLowerCase();
    return s == 'true' || s == '1';
  }

  /// Asks the game to handle the Android back press.
  /// Returns `true` if the game consumed it (closed a panel, went back to the
  /// menu...), `false` if the game is at its home screen.
  static Future<bool> back(WebViewController controller) async {
    try {
      final result = await controller.runJavaScriptReturningResult(
        'window.__cuboraBack ? window.__cuboraBack() : false',
      );
      return parseBool(result);
    } catch (_) {
      return false;
    }
  }

  static Future<void> pause(WebViewController controller) => _run(
        controller,
        'window.__cuboraPause && window.__cuboraPause()',
      );

  static Future<void> resume(WebViewController controller) => _run(
        controller,
        'window.__cuboraResume && window.__cuboraResume()',
      );

  static Future<void> _run(WebViewController c, String js) async {
    try {
      await c.runJavaScript(js);
    } catch (_) {
      // The page may not be ready yet - nothing to pause/resume then.
    }
  }
}
