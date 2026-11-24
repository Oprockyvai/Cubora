import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Shown only if the bundled game fails to load (should be very rare).
class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(gradient: CuboraTheme.backdrop),
      child: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline_rounded, size: 56, color: CuboraColors.pink),
                const SizedBox(height: 16),
                const Text(
                  'Something went wrong',
                  style: TextStyle(color: CuboraColors.text, fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Cubora could not start. Please try again.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: CuboraColors.muted, fontSize: 14),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: onRetry,
                  style: FilledButton.styleFrom(
                    backgroundColor: CuboraColors.gold,
                    foregroundColor: const Color(0xFF2A1D00),
                    minimumSize: const Size(180, 52),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    textStyle: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: .4),
                  ),
                  child: const Text('TRY AGAIN'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
