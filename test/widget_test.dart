import 'package:cubora/core/game_bridge.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('GameBridge.levelFor', () {
    test('maps vibration durations to haptic levels', () {
      expect(GameBridge.levelFor(0), HapticLevel.none);
      expect(GameBridge.levelFor(10), HapticLevel.tick);
      expect(GameBridge.levelFor(30), HapticLevel.light);
      expect(GameBridge.levelFor(60), HapticLevel.medium);
      expect(GameBridge.levelFor(200), HapticLevel.heavy);
    });
  });

  group('GameBridge.parseBool', () {
    test('understands every JS result shape', () {
      expect(GameBridge.parseBool(true), isTrue);
      expect(GameBridge.parseBool('true'), isTrue);
      expect(GameBridge.parseBool(1), isTrue);
      expect(GameBridge.parseBool(false), isFalse);
      expect(GameBridge.parseBool('false'), isFalse);
      expect(GameBridge.parseBool('null'), isFalse);
      expect(GameBridge.parseBool(null), isFalse);
    });
  });
}
