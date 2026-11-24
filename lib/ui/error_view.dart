import 'package:flutter/material.dart';

class ErrorView extends StatelessWidget {
  const ErrorView({
    super.key,
    required this.onRetry,
  });

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: const Color(0xFF0D1030),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset(
                'assets/branding/logo.png',
                width: 96,
                height: 96,
              ),
              const SizedBox(height: 20),
              const Text(
                'Could not load Cubora',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 18),
              FilledButton(
                onPressed: onRetry,
                child: const Text('Try again'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
