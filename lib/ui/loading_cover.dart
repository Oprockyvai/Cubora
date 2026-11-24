import 'package:flutter/material.dart';

class LoadingCover extends StatelessWidget {
  const LoadingCover({super.key});

  @override
  Widget build(BuildContext context) {
    return const ColoredBox(
      color: Color(0xFF0D1030),
      child: Center(
        child: Image(
          image: AssetImage('assets/branding/logo.png'),
          width: 120,
          height: 120,
        ),
      ),
    );
  }
}
