import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import '../core/game_bridge.dart';
import '../core/theme.dart';
import 'error_view.dart';
import 'exit_dialog.dart';
import 'loading_cover.dart';

/// Hosts the Cubora game (bundled HTML5, fully offline) inside a native shell.
class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> with WidgetsBindingObserver {
  static const String _entry = 'assets/game/index.html';

  late final WebViewController _web;
  bool _ready = false;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _web = _createController();
    unawaited(_web.loadFlutterAsset(_entry));
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  WebViewController _createController() {
    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(CuboraColors.bg)
      ..enableZoom(false)
      ..addJavaScriptChannel(
        GameBridge.channelName,
        onMessageReceived: (m) => GameBridge.onMessage(m.message),
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          // The game is 100% offline: never navigate away from the bundled files.
          onNavigationRequest: (request) {
            final url = request.url;
            final local = url.startsWith('file:') || url.startsWith('about:');
            return local ? NavigationDecision.navigate : NavigationDecision.prevent;
          },
          onPageFinished: (_) {
            // Small delay so the game's own splash is already painted.
            Future<void>.delayed(const Duration(milliseconds: 150), () {
              if (mounted) setState(() => _ready = true);
            });
          },
          onWebResourceError: (error) {
            if (error.isForMainFrame ?? false) {
              if (mounted) setState(() => _failed = true);
            }
          },
        ),
      );

    final platform = controller.platform;
    if (platform is AndroidWebViewController) {
      unawaited(AndroidWebViewController.enableDebugging(kDebugMode));
      unawaited(platform.setMediaPlaybackRequiresUserGesture(false));
    }
    return controller;
  }

  void _reload() {
    setState(() {
      _failed = false;
      _ready = false;
    });
    unawaited(_web.loadFlutterAsset(_entry));
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.hidden:
      case AppLifecycleState.paused:
        unawaited(GameBridge.pause(_web)); // stop music + timers in background
      case AppLifecycleState.resumed:
        unawaited(GameBridge.resume(_web));
      case AppLifecycleState.inactive:
      case AppLifecycleState.detached:
        break;
    }
  }

  Future<void> _onBack() async {
    final consumed = await GameBridge.back(_web);
    if (consumed || !mounted) return;
    final quit = await showExitDialog(context);
    if (quit) await SystemNavigator.pop();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) unawaited(_onBack());
      },
      child: Scaffold(
        resizeToAvoidBottomInset: false,
        body: Stack(
          fit: StackFit.expand,
          children: [
            const DecoratedBox(
              decoration: BoxDecoration(gradient: CuboraTheme.backdrop),
            ),
            SafeArea(child: WebViewWidget(controller: _web)),
            if (_failed) ErrorView(onRetry: _reload),
            LoadingCover(visible: !_ready && !_failed),
          ],
        ),
      ),
    );
  }
}
