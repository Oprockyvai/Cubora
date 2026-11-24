// Cubora - one-time project setup.
//
//   dart run tool/setup.dart --org com.yourname
//
// What it does (safe to run again, it is idempotent):
//   1. Generates the Android host project with `flutter create` (matching YOUR Flutter SDK)
//   2. Applies the Cubora Android customisation from android_overlay/
//      (manifest, themes, splash, launcher icons, signing template)
//   3. Adds release-signing support to android/app/build.gradle(.kts)
//   4. Runs `flutter pub get`
//
// The package name ("applicationId") is PERMANENT once the app is on Google Play.
// Choose it carefully, e.g. com.yourname.cubora

import 'dart:io';

const String _defaultOrg = 'com.cubora';
const String _projectName = 'cubora';

Future<void> main(List<String> args) async {
  final org = _readOption(args, '--org') ?? _defaultOrg;

  if (!File('pubspec.yaml').existsSync() || !Directory('android_overlay').existsSync()) {
    _fail('Run this script from the project root (the folder that contains pubspec.yaml).');
  }

  _step('Checking Flutter');
  if (!await _run('flutter', ['--version'], quiet: true)) {
    _fail('Flutter was not found. Install it first: https://docs.flutter.dev/get-started/install');
  }

  if (Directory('android').existsSync()) {
    _info('android/ already exists - keeping it.');
  } else {
    _step('Generating Android project  (package: $org.$_projectName)');
    final ok = await _run('flutter', [
      'create',
      '--platforms=android',
      '--org',
      org,
      '--project-name',
      _projectName,
      '.',
    ]);
    if (!ok) _fail('"flutter create" failed. See the messages above.');
  }

  _step('Applying Cubora Android customisation');
  _copyDir(Directory('android_overlay'), Directory('android'));
  _info('manifest, themes, splash and launcher icons installed.');

  _step('Enabling release signing');
  _patchGradle();

  _step('Fetching packages');
  if (!await _run('flutter', ['pub', 'get'])) {
    _fail('"flutter pub get" failed. See the messages above.');
  }

  stdout.writeln('''

All set!  Next steps
  1. Test on a phone:        flutter run
  2. Create your upload key: see README.md  (section "Signing key")
  3. Build for Play Store:   flutter build appbundle --release
''');
}

// ---------------------------------------------------------------------------
// Gradle patching (release signing)
// ---------------------------------------------------------------------------

void _patchGradle() {
  final kts = File('android/app/build.gradle.kts');
  final groovy = File('android/app/build.gradle');
  if (kts.existsSync()) {
    _patch(kts, kotlin: true);
  } else if (groovy.existsSync()) {
    _patch(groovy, kotlin: false);
  } else {
    _warn('Could not find android/app/build.gradle(.kts). Add signing manually (README.md).');
  }
}

void _patch(File file, {required bool kotlin}) {
  var src = file.readAsStringSync();
  if (src.contains('keystoreProperties')) {
    _info('${file.path} already patched.');
    return;
  }

  final loader = kotlin
      ? '''
val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

'''
      : '''
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

''';

  final signing = kotlin
      ? '''
    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }

'''
      : '''
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }

''';

  // 1) key.properties loader goes right before the top-level `android {` block.
  final androidBlock = RegExp(r'^android\s*\{', multiLine: true);
  // 2) signingConfigs go right before `buildTypes {`.
  final buildTypes = RegExp(r'^([ \t]*)buildTypes\s*\{', multiLine: true);
  // 3) the template signs release builds with the debug key - swap that out.
  final debugSigning = kotlin
      ? RegExp(r'signingConfig\s*=\s*signingConfigs\.getByName\("debug"\)')
      : RegExp(r'signingConfig\s+signingConfigs\.debug');

  if (!androidBlock.hasMatch(src) || !buildTypes.hasMatch(src) || !debugSigning.hasMatch(src)) {
    _warn('Unexpected layout in ${file.path} - please add release signing manually (README.md, "Signing key").');
    return;
  }

  src = src.replaceFirstMapped(androidBlock, (m) => '$loader${m.group(0)}');
  src = src.replaceFirstMapped(buildTypes, (m) => '$signing${m.group(0)}');
  src = src.replaceFirst(
    debugSigning,
    kotlin
        ? 'signingConfig = if (keystorePropertiesFile.exists()) signingConfigs.getByName("release") else signingConfigs.getByName("debug")'
        : 'signingConfig keystorePropertiesFile.exists() ? signingConfigs.release : signingConfigs.debug',
  );

  if (kotlin) {
    src = 'import java.io.FileInputStream\nimport java.util.Properties\n\n$src';
  }

  file.writeAsStringSync(src);
  _info('${file.path} patched: release builds use android/key.properties when present.');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

String? _readOption(List<String> args, String name) {
  for (var i = 0; i < args.length; i++) {
    final a = args[i];
    if (a == name && i + 1 < args.length) return args[i + 1];
    if (a.startsWith('$name=')) return a.substring(name.length + 1);
  }
  return null;
}

void _copyDir(Directory src, Directory dst) {
  for (final entity in src.listSync(recursive: true, followLinks: false)) {
    if (entity is! File) continue;
    final rel = entity.path.substring(src.path.length + 1);
    final out = File('${dst.path}${Platform.pathSeparator}$rel');
    out.parent.createSync(recursive: true);
    entity.copySync(out.path);
  }
}

Future<bool> _run(String cmd, List<String> args, {bool quiet = false}) async {
  try {
    final process = await Process.start(
      cmd,
      args,
      runInShell: true,
      mode: quiet ? ProcessStartMode.normal : ProcessStartMode.inheritStdio,
    );
    if (quiet) {
      await Future.wait([process.stdout.drain<void>(), process.stderr.drain<void>()]);
    }
    return (await process.exitCode) == 0;
  } on ProcessException {
    return false;
  }
}

void _step(String message) => stdout.writeln('\n==> $message');
void _info(String message) => stdout.writeln('    $message');
void _warn(String message) => stdout.writeln('    [!] $message');

Never _fail(String message) {
  stderr.writeln('\nERROR: $message');
  exit(1);
}
