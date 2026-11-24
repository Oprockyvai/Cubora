import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Branded cover shown while the WebView boots. It matches the native Android
/// launch screen (same backdrop, same logo position) so the hand-over from
/// system splash -> Flutter -> game is seamless.
class LoadingCover extends StatelessWidget {
  const LoadingCover({super.key, required this.visible});

  final bool visible;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      ignoring: !visible,
      child: AnimatedOpacity(
        opacity: visible ? 1 : 0,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOut,
        child: const DecoratedBox(
          decoration: BoxDecoration(gradient: CuboraTheme.backdrop),
          child: Center(
            child: Image(
              image: AssetImage('assets/branding/logo.png'),
              width: 168,
              height: 168,
              filterQuality: FilterQuality.medium,
            ),
          ),
        ),
      ),
    );
  }
}
