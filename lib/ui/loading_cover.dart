import 'package:flutter/material.dart';

import '../core/theme.dart';

class LoadingCover extends StatelessWidget {
  const LoadingCover({super.key, required this.visible});

  final bool visible;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      ignoring: !visible,
      child: AnimatedOpacity(
        opacity: visible ? 1 : 0,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOut,
        child: DecoratedBox(
          decoration: const BoxDecoration(gradient: CuboraTheme.backdrop),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Image.asset(
                  'assets/branding/logo.png',
                  width: 88,
                  height: 88,
                  filterQuality: FilterQuality.high,
                ),
                const SizedBox(height: 18),
                const Text(
                  'CUBORA',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 4,
                    color: CuboraColors.text,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
