import 'package:flutter/material.dart';

class ExitDialog extends StatelessWidget {
  const ExitDialog({super.key});

  static Future<bool> show(BuildContext context) async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (_) => const ExitDialog(),
    );
    return result ?? false;
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Quit Cubora?'),
      content: const Text('Your current progress is saved.'),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(true),
          child: const Text('Quit'),
        ),
      ],
    );
  }
}
