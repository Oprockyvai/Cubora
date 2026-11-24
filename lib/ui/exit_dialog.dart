import 'package:flutter/material.dart';

import '../core/theme.dart';

Future<bool> showExitDialog(BuildContext context) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: CuboraColors.panel,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: BorderSide(
          color: CuboraColors.violet.withValues(alpha: 0.45),
        ),
      ),
      title: const Text(
        'Quit Cubora?',
        style: TextStyle(
          color: CuboraColors.text,
          fontWeight: FontWeight.w800,
        ),
      ),
      content: const Text(
        'Your progress and scores are saved on this device.',
        style: TextStyle(color: CuboraColors.muted),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(false),
          child: const Text(
            'Stay',
            style: TextStyle(color: CuboraColors.muted),
          ),
        ),
        FilledButton(
          onPressed: () => Navigator.of(ctx).pop(true),
          style: FilledButton.styleFrom(
            backgroundColor: CuboraColors.gold,
            foregroundColor: const Color(0xFF2A1D00),
          ),
          child: const Text(
            'Quit',
            style: TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
      ],
    ),
  );
  return result ?? false;
}
