import 'package:flutter/material.dart';

const cuboraBackground = Color(0xFF0D1030);

final ThemeData cuboraTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  scaffoldBackgroundColor: cuboraBackground,
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFFB39BF7),
    brightness: Brightness.dark,
    surface: cuboraBackground,
  ),
);
