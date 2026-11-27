import 'package:flutter/material.dart';

import 'core/theme.dart';
import 'ui/game_screen.dart';

class CuboraApp extends StatelessWidget {
  const CuboraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Block Clash',
      debugShowCheckedModeBanner: false,
      theme: CuboraTheme.dark,
      home: const GameScreen(),
    );
  }
}
