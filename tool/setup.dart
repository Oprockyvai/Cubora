import 'dart:io';

const _usage = 'Usage: dart run tool/setup.dart --org com.example';

Future<void> main(List<String> arguments) async {
  final org = _readOrg(arguments);
  if (org == null) {
    stderr.writeln(_usage);
    exitCode = 64;
    return;
  }

  final root = Directory.current;
  final flutter = Platform.isWindows ? 'flutter.bat' : 'flutter';
  if (!await _hasExecutable(flutter)) {
    stderr.writeln('Flutter is not available on PATH.');
    exitCode = 127;
    return;
  }

  final android = Directory('${root.path}${Platform.pathSeparator}android');
  if (!await android.exists()) {
    stdout.writeln('Creating Android project...');
    final created = await Process.run(
      flutter,
      ['create', '--platforms', 'android', '--org', org, '--project-name', 'cubora', '.'],
      workingDirectory: root.path,
      runInShell: true,
    );
    if (created.exitCode != 0) {
      stderr.write(created.stderr);
      exitCode = created.exitCode;
      return;
    }
  }

  final overlay = Directory('${root.path}${Platform.pathSeparator}android_overlay');
  if (!await overlay.exists()) {
    stderr.writeln('Missing android_overlay directory.');
    exitCode = 1;
    return;
  }

  await _copyDirectory(
    Directory('${overlay.path}${Platform.pathSeparator}app${Platform.pathSeparator}src${Platform.pathSeparator}main'),
    Directory('${android.path}${Platform.pathSeparator}app${Platform.pathSeparator}src${Platform.pathSeparator}main'),
  );

  await File('${root.path}${Platform.pathSeparator}android${Platform.pathSeparator}key.properties.example')
      .parent
      .create(recursive: true);
  await File('${overlay.path}${Platform.pathSeparator}key.properties.example').copy(
    '${android.path}${Platform.pathSeparator}key.properties.example',
  );

  await _configureGradle(android, '$org.cubora');

  stdout.writeln('Running flutter pub get...');
  final fetched = await Process.run(
    flutter,
    ['pub', 'get'],
    workingDirectory: root.path,
    runInShell: true,
  );
  stdout.write(fetched.stdout);
  stderr.write(fetched.stderr);

  if (fetched.exitCode != 0) {
    exitCode = fetched.exitCode;
    return;
  }

  stdout.writeln('Cubora Android setup complete.');
  stdout.writeln('Application ID: $org.cubora');
  stdout.writeln('Signing template: android/key.properties.example');
}

String? _readOrg(List<String> arguments) {
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i] == '--org' && i + 1 < arguments.length) {
      final value = arguments[i + 1].trim();
      if (RegExp(r'^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9]*)+$').hasMatch(value)) {
        return value;
      }
      return null;
    }
  }
  return null;
}

Future<bool> _hasExecutable(String executable) async {
  final result = await Process.run(
    Platform.isWindows ? 'where' : 'which',
    [executable],
    runInShell: true,
  );
  return result.exitCode == 0;
}

Future<void> _copyDirectory(Directory source, Directory destination) async {
  await destination.create(recursive: true);
  await for (final entity in source.list(recursive: true)) {
    final relative = entity.path.substring(source.path.length + 1);
    final targetPath =
        '${destination.path}${Platform.pathSeparator}${relative.replaceAll('/', Platform.pathSeparator)}';
    if (entity is File) {
      await File(targetPath).parent.create(recursive: true);
      await entity.copy(targetPath);
    } else if (entity is Directory) {
      await Directory(targetPath).create(recursive: true);
    }
  }
}

Future<void> _configureGradle(Directory android, String applicationId) async {
  final kts = File('${android.path}${Platform.pathSeparator}app${Platform.pathSeparator}build.gradle.kts');
  final groovy = File('${android.path}${Platform.pathSeparator}app${Platform.pathSeparator}build.gradle');

  if (await kts.exists()) {
    var text = await kts.readAsString();
    text = text.replaceAll(
      RegExp(r'applicationId\s*=\s*"[^"]*"'),
      'applicationId = "$applicationId"',
    );
    text = text.replaceAll(
      RegExp(r'applicationId\s*=\s*"[^\n]*'),
      'applicationId = "$applicationId"',
    );
    text = text.replaceAll(
      RegExp(r'namespace\s*=\s*"[^"]*"'),
      'namespace = "$applicationId"',
    );
    text = text.replaceAll(
      RegExp(r'targetSdk\s*=\s*[^\\n]+'),
      'targetSdk = 36',
    );
    text = text.replaceAll(
      RegExp(r'compileSdk\s*=\s*[^\\n]+'),
      'compileSdk = 36',
    );
    text = text.replaceAll(
      RegExp(r'minSdk\s*=\s*[^\\n]+'),
      'minSdk = flutter.minSdkVersion',
    );
    await kts.writeAsString(text);
  } else if (await groovy.exists()) {
    var text = await groovy.readAsString();
    text = text.replaceAll(
      RegExp(r'applicationId\s*"[^"]*"'),
      'applicationId "$applicationId"',
    );
    text = text.replaceAll(
      RegExp(r'namespace\s*"[^"]*"'),
      'namespace "$applicationId"',
    );
    text = text.replaceAll(
      RegExp(r'targetSdk\s+[^\\n]+'),
      'targetSdk 36',
    );
    text = text.replaceAll(
      RegExp(r'compileSdk\s+[^\\n]+'),
      'compileSdk 36',
    );
    text = text.replaceAll(
      RegExp(r'minSdk\s+[^\\n]+'),
      'minSdk flutter.minSdkVersion',
    );
    await groovy.writeAsString(text);
  }
}
