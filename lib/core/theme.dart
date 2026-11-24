import 'package:flutter/material.dart';

/// Brand palette - taken 1:1 from the game's CSS variables so the native
/// shell and the game look like one product.
abstract final class CuboraColors {
  static const Color bg = Color(0xFF0D1030);
  static const Color bg2 = Color(0xFF241468);
  static const Color panel = Color(0xFF151A4C);
  static const Color text = Color(0xFFF2F4FF);
  static const Color muted = Color(0xFF9AA2E0);
  static const Color gold = Color(0xFFFFC94A);
  static const Color violet = Color(0xFFB39BF7);
  static const Color cyan = Color(0xFF56DFF7);
  static const Color pink = Color(0xFFF7768E);
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
