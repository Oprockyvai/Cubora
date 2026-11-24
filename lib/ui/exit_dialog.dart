import 'package:flutter/material.dart';

import '../core/theme.dart';

/// "Quit Cubora?" confirmation, styled like the game's own cards.
/// Resolves to `true` when the player confirms.
Future<bool> showExitDialog(BuildContext context) async {
  final result = await showGeneralDialog<bool>(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'Dismiss',
    barrierColor: const Color(0xB3060820),
    transitionDuration: const Duration(milliseconds: 220),
    pageBuilder: (_, __, ___) => const _ExitCard(),
    transitionBuilder: (_, animation, __, child) {
      final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutBack);
      return FadeTransition(
        opacity: animation,
        child: ScaleTransition(scale: Tween<double>(begin: .9, end: 1).animate(curved), child: child),
      );
    },
  );
  return result ?? false;
}

class _ExitCard extends StatelessWidget {
  const _ExitCard();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 310,
        margin: const EdgeInsets.symmetric(horizontal: 24),
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
        decoration: BoxDecoration(
          color: CuboraColors.panel,
          borderRadius: BorderRadius.circular(26),
          border: Border.all(color: CuboraColors.violet.withAlpha(140), width: 1.5),
          boxShadow: [
            BoxShadow(color: CuboraColors.violet.withAlpha(70), blurRadius: 40),
            const BoxShadow(color: Color(0x80000000), blurRadius: 60, offset: Offset(0, 24)),
          ],
        ),
        child: Material(
          type: MaterialType.transparency,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Image(
                image: AssetImage('assets/branding/logo.png'),
                width: 72,
                height: 72,
              ),
              const SizedBox(height: 14),
              const Text(
                'QUIT CUBORA?',
                style: TextStyle(
                  color: CuboraColors.text,
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  letterSpacing: .3,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Your progress is saved automatically.',
                textAlign: TextAlign.center,
                style: TextStyle(color: CuboraColors.muted, fontSize: 14, height: 1.4),
              ),
              const SizedBox(height: 22),
              _GoldButton(label: 'KEEP PLAYING', onTap: () => Navigator.of(context).pop(false)),
              const SizedBox(height: 10),
              _OutlineButton(label: 'QUIT', onTap: () => Navigator.of(context).pop(true)),
            ],
          ),
        ),
      ),
    );
  }
}

class _GoldButton extends StatelessWidget {
  const _GoldButton({required this.label, required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          height: 52,
          decoration: BoxDecoration(
            gradient: CuboraTheme.goldButton,
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [BoxShadow(color: Color(0x59FFB62E), blurRadius: 22, offset: Offset(0, 8))],
          ),
          child: Center(
            child: Text(
              label,
              style: const TextStyle(
                color: Color(0xFF2A1D00),
                fontSize: 15,
                fontWeight: FontWeight.w800,
                letterSpacing: .4,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OutlineButton extends StatelessWidget {
  const _OutlineButton({required this.label, required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          height: 50,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: CuboraColors.gold, width: 1.5),
          ),
          child: Center(
            child: Text(
              label,
              style: const TextStyle(
                color: CuboraColors.gold,
                fontSize: 15,
                fontWeight: FontWeight.w800,
                letterSpacing: .4,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
