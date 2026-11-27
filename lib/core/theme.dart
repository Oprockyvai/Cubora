import 'package:flutter/material.dart';

/// Brand palette - taken 1:1 from the game's CSS variables so the native
/// shell and the game look like one product.
abstract final class CuboraColors {
  static const Color bg = Color(0xFF090E1D);
  static const Color bg2 = Color(0xFF141C38);
  static const Color panel = Color(0xFF11182F);
  static const Color text = Color(0xFFF3F6FF);
  static const Color muted = Color(0xFF99A6CF);
  static const Color gold = Color(0xFFFFC845);
  static const Color violet = Color(0xFF9A85FF);
  static const Color cyan = Color(0xFF34D3FF);
  static const Color pink = Color(0xFFFF5D7A);
}

abstract final class CuboraTheme {
  /// Same look as the game's `body` background: a soft purple glow at the top
  /// fading into deep navy. It is painted behind the WebView so the status bar
  /// and gesture-bar areas blend seamlessly with the game.
  static const RadialGradient backdrop = RadialGradient(
    center: Alignment.topCenter,
    radius: 0.84,
    colors: [CuboraColors.bg2, CuboraColors.bg],
  );

  static const LinearGradient goldButton = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFFFFD75E), Color(0xFFFFB62E)],
  );

  static ThemeData get dark {
    final scheme = ColorScheme.fromSeed(
      seedColor: CuboraColors.violet,
      brightness: Brightness.dark,
    ).copyWith(
      surface: CuboraColors.panel,
      primary: CuboraColors.gold,
      onPrimary: const Color(0xFF2A1D00),
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: CuboraColors.bg,
      splashFactory: InkSparkle.splashFactory,
    );
  }
}
