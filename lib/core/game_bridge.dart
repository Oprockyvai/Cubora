import 'package:flutter/services.dart';

enum HapticLevel { none, tick, light, medium, heavy }

class GameBridge {
  const GameBridge();

  static HapticLevel levelFor(int milliseconds) {
    if (milliseconds <= 0) return HapticLevel.none;
    if (milliseconds < 20) return HapticLevel.tick;
    if (milliseconds < 50) return HapticLevel.light;
    if (milliseconds < 100) return HapticLevel.medium;
    return HapticLevel.heavy;
  }

  static bool parseBool(Object? value) {
    if (value is bool) return value;
    if (value is num) return value != 0;
    if (value is String) {
      final normalized = value.trim().toLowerCase();
      return normalized == 'true' || normalized == '1';
    }
    return false;
  }

  Future<void> vibrate(String message) async {
    final value = int.tryParse(message.startsWith('h:')
        ? message.substring(2)
        : message);
    if (value == null) return;

    switch (levelFor(value)) {
      case HapticLevel.none:
        return;
      case HapticLevel.tick:
        await HapticFeedback.selectionClick();
      case HapticLevel.light:
        await HapticFeedback.lightImpact();
      case HapticLevel.medium:
        await HapticFeedback.mediumImpact();
      case HapticLevel.heavy:
        await HapticFeedback.heavyImpact();
    }
  }
}
