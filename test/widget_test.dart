import 'package:flutter_test/flutter_test.dart';

import 'package:cubora/core/game_bridge.dart';

void main() {
  test('GameBridge maps haptic durations cleanly', () {
    expect(GameBridge.levelFor(0), HapticLevel.none);
    expect(GameBridge.levelFor(8), HapticLevel.tick);
    expect(GameBridge.levelFor(30), HapticLevel.light);
    expect(GameBridge.levelFor(60), HapticLevel.medium);
    expect(GameBridge.levelFor(90), HapticLevel.heavy);
  });

  test('GameBridge parses boolean JS results', () {
    expect(GameBridge.parseBool(true), isTrue);
    expect(GameBridge.parseBool('true'), isTrue);
    expect(GameBridge.parseBool(1), isTrue);
    expect(GameBridge.parseBool('1'), isTrue);
    expect(GameBridge.parseBool(false), isFalse);
    expect(GameBridge.parseBool('false'), isFalse);
    expect(GameBridge.parseBool(null), isFalse);
  });
}
