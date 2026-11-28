import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import '../core/ads_policy.dart';
import '../core/ads_service.dart';
import '../core/game_bridge.dart';
import '../core/theme.dart';
import 'error_view.dart';
import 'exit_dialog.dart';
import 'loading_cover.dart';
import 'web_game_frame_stub.dart'
    if (dart.library.js_interop) 'web_game_frame_web.dart';

/// Hosts the Cubora game (bundled HTML5, fully offline) inside a native shell,
/// with a web iframe fallback when running in Flutter Web preview.
class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> with WidgetsBindingObserver {
  static const String _entry = 'assets/game/index.html';

  WebViewController? _web;
  bool _ready = false;
  bool _failed = false;
  int _webReloadKey = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    if (!kIsWeb) {
      final controller = _createController();
      _web = controller;
      unawaited(controller.loadFlutterAsset(_entry));
      // Start ads after the first frame so consent UI has an Activity to attach to.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        AdsService.instance.onStateChanged = _pushAdState;
        unawaited(AdsService.instance.start());
      });
    }
  }

  /// Tells the game which ad formats are ready (it hides ad buttons otherwise).
  void _pushAdState(
    bool rewardedReady,
    bool interstitialReady,
    bool privacyRequired,
  ) {
    final c = _web;
    if (c == null || !mounted) return;
    unawaited(
      c
          .runJavaScript(
            'window.__cuboraAdState && window.__cuboraAdState($rewardedReady,$interstitialReady,$privacyRequired)',
          )
          .catchError((Object _) {}),
    );
  }

  Future<void> _onJsMessage(String message) async {
    final ad = AdMessage.parse(message);
    if (ad == null) return GameBridge.onMessage(message);
    final c = _web;
    if (c == null) return;
    switch (ad) {
      case AdQuery():
        _pushAdState(
          AdsService.instance.rewardedReady,
          AdsService.instance.interstitialReady,
          AdsService.instance.privacyOptionsRequired,
        );
      case AdPrivacy():
        await AdsService.instance.showPrivacyOptions();
      case AdInterstitial():
        await GameBridge.pause(c);
        await AdsService.instance.maybeShowInterstitial();
        if (mounted) await GameBridge.resume(c);
      case AdRewarded(:final requestId):
        await GameBridge.pause(c);
        final outcome = await AdsService.instance.showRewarded();
        if (!mounted) return;
        await GameBridge.resume(c);
        await GameBridge.adResult(c, requestId, outcome);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    AdsService.instance.onStateChanged = null;
    super.dispose();
  }

  WebViewController _createController() {
    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(CuboraColors.bg)
      ..enableZoom(false)
      ..addJavaScriptChannel(
        GameBridge.channelName,
        onMessageReceived: (m) => unawaited(_onJsMessage(m.message)),
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
      _webReloadKey++;
    });
    if (!kIsWeb && _web != null) {
      unawaited(_web!.loadFlutterAsset(_entry));
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final controller = _web;
    if (controller == null) return;
    switch (state) {
      case AppLifecycleState.hidden:
      case AppLifecycleState.paused:
        unawaited(GameBridge.pause(controller)); // stop music + timers in background
      case AppLifecycleState.resumed:
        unawaited(GameBridge.resume(controller));
      case AppLifecycleState.inactive:
      case AppLifecycleState.detached:
        break;
    }
  }

  Future<void> _onBack() async {
    final controller = _web;
    if (controller != null) {
      final consumed = await GameBridge.back(controller);
      if (consumed || !mounted) return;
    }
    if (!mounted) return;
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
            SafeArea(
              child: kIsWeb
                  ? KeyedSubtree(
                      key: ValueKey(_webReloadKey),
                      child: buildWebGameFrame(
                        assetPath: _entry,
                        onReady: () {
                          if (mounted) setState(() => _ready = true);
                        },
                        onError: () {
                          if (mounted) setState(() => _failed = true);
                        },
                      ),
                    )
                  : WebViewWidget(controller: _web!),
            ),
            if (_failed) ErrorView(onRetry: _reload),
            LoadingCover(visible: !_ready && !_failed),
          ],
        ),
      ),
    );
  }
}
