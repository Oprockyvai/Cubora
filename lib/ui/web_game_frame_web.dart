import 'dart:js_interop';
import 'dart:ui_web' as ui_web;

import 'package:flutter/widgets.dart';
import 'package:web/web.dart' as web;

int _frameCounter = 0;

Widget buildWebGameFrame({
  required String assetPath,
  required VoidCallback onReady,
  required VoidCallback onError,
}) {
  return _WebGameIframe(
    assetPath: assetPath,
    onReady: onReady,
    onError: onError,
  );
}

class _WebGameIframe extends StatefulWidget {
  const _WebGameIframe({
    required this.assetPath,
    required this.onReady,
    required this.onError,
  });

  final String assetPath;
  final VoidCallback onReady;
  final VoidCallback onError;

  @override
  State<_WebGameIframe> createState() => _WebGameIframeState();
}

class _WebGameIframeState extends State<_WebGameIframe> {
  late final String _viewType;

  @override
  void initState() {
    super.initState();
    _viewType = 'cubora-game-frame-${++_frameCounter}';
    ui_web.platformViewRegistry.registerViewFactory(_viewType, (int viewId) {
      final iframe =
          web.document.createElement('iframe') as web.HTMLIFrameElement;
      iframe.style.border = 'none';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.display = 'block';
      iframe.style.backgroundColor = '#0d1030';
      iframe.allow = 'autoplay';
      iframe.addEventListener(
        'load',
        ((web.Event _) {
          widget.onReady();
        }).toJS,
      );
      iframe.addEventListener(
        'error',
        ((web.Event _) {
          widget.onError();
        }).toJS,
      );
      iframe.src = 'assets/${widget.assetPath}';
      return iframe;
    });
  }

  @override
  Widget build(BuildContext context) {
    return HtmlElementView(viewType: _viewType);
  }
}
