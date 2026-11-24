import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import '../core/game_bridge.dart';
import 'error_view.dart';
import 'exit_dialog.dart';
import 'loading_cover.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen>
    with WidgetsBindingObserver {
  final GameBridge _bridge = const GameBridge();
  late final WebViewController _controller;
  bool _loading = true;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _createController();
  }

  void _createController() {
    late final PlatformWebViewControllerCreationParams params;
    if (Platform.isAndroid) {
      params = AndroidWebViewControllerCreationParams();
    } else {
      params = const PlatformWebViewControllerCreationParams();
    }

    _controller = WebViewController.fromPlatformCreationParams(params)
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0D1030))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) {
              setState(() {
                _loading = true;
                _failed = false;
              });
            }
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
          onWebResourceError: (_) {
            if (mounted) {
              setState(() {
                _loading = false;
                _failed = true;
              });
            }
          },
        ),
      )
      ..addJavaScriptChannel(
        'CuboraBridge',
        onMessageReceived: (message) {
          if (message.message.startsWith('h:')) {
            _bridge.vibrate(message.message);
          }
        },
      )
      ..loadFlutterAsset('assets/game/index.html');

    if (_controller.platform is AndroidWebViewController) {
      AndroidWebViewController.enableDebugging(false);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      _controller.runJavaScript('window.__cuboraPause?.()');
    } else if (state == AppLifecycleState.resumed) {
      _controller.runJavaScript('window.__cuboraResume?.()');
    }
  }

  Future<void> _retry() async {
    setState(() {
      _failed = false;
      _loading = true;
    });
    await _controller.loadFlutterAsset('assets/game/index.html');
  }

  Future<void> _handleBack() async {
    if (_failed) {
      await SystemNavigator.pop();
      return;
    }
    final result = await _controller.runJavaScriptReturningResult(
      'window.__cuboraBack?.()',
    );
    final consumed = GameBridge.parseBool(result);
    if (!consumed && mounted) {
      final quit = await ExitDialog.show(context);
      if (quit) await SystemNavigator.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) {
        if (!didPop) _handleBack();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF0D1030),
        body: SafeArea(
          top: false,
          bottom: false,
          child: Stack(
            fit: StackFit.expand,
            children: [
              WebViewWidget(controller: _controller),
              if (_loading) const LoadingCover(),
              if (_failed)
                ErrorView(onRetry: _retry),
            ],
          ),
        ),
      ),
    );
  }
}
