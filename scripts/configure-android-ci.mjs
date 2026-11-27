import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const androidDir = path.join(rootDir, 'android');
const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
const gradleKtsPath = path.join(androidDir, 'app', 'build.gradle.kts');
const gradleGroovyPath = path.join(androidDir, 'app', 'build.gradle');
const resDir = path.join(androidDir, 'app', 'src', 'main', 'res');

function patchManifest() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing AndroidManifest.xml at ${manifestPath}`);
  }
  let xml = fs.readFileSync(manifestPath, 'utf8');

  // Set user-facing app label to Block Clash
  if (/android:label="[^"]*"/.test(xml)) {
    xml = xml.replace(/android:label="[^"]*"/, 'android:label="Block Clash"');
  }

  // Ensure hardware acceleration and offline security flags on <application
  xml = xml.replace(/<application\b([^>]*)>/, (full, attrs) => {
    let nextAttrs = attrs;
    if (!/android:hardwareAccelerated=/.test(nextAttrs)) {
      nextAttrs += '\n        android:hardwareAccelerated="true"';
    }
    if (!/android:usesCleartextTraffic=/.test(nextAttrs)) {
      nextAttrs += '\n        android:usesCleartextTraffic="false"';
    }
    return `<application${nextAttrs}>`;
  });

  // Lock activity to portrait & hardwareAccelerated if needed
  xml = xml.replace(/<activity\b([^>]*)>/, (full, attrs) => {
    let nextAttrs = attrs;
    if (!/android:screenOrientation=/.test(nextAttrs)) {
      nextAttrs += '\n            android:screenOrientation="portrait"';
    }
    return `<activity${nextAttrs}>`;
  });

  fs.writeFileSync(manifestPath, xml, 'utf8');
  console.log('Configured AndroidManifest.xml (Block Clash, hardwareAccelerated, portrait)');
}

function patchGradle() {
  const isKts = fs.existsSync(gradleKtsPath);
  const gradlePath = isKts ? gradleKtsPath : gradleGroovyPath;
  if (!fs.existsSync(gradlePath)) {
    throw new Error('Missing android/app/build.gradle(.kts)');
  }

  let gradle = fs.readFileSync(gradlePath, 'utf8');

  // Enforce clean applicationId and minSdk >= 21 for modern Android WebView
  if (isKts) {
    gradle = gradle.replace(/applicationId\s*=\s*"[^"]*"/, 'applicationId = "com.blockclash.game"');
    gradle = gradle.replace(/minSdk\s*=\s*flutter\.minSdkVersion/, 'minSdk = maxOf(flutter.minSdkVersion, 21)');
  } else {
    gradle = gradle.replace(/applicationId\s+["'][^"']*["']/, 'applicationId "com.blockclash.game"');
    gradle = gradle.replace(/minSdkVersion\s+flutter\.minSdkVersion/, 'minSdkVersion Math.max(flutter.minSdkVersion, 21)');
  }

  // Optional CI keystore signing (populated automatically if Codemagic keystore env vars are set)
  const keystorePath = process.env.CM_KEYSTORE_PATH;
  const keystorePassword = process.env.CM_KEYSTORE_PASSWORD;
  const keyAlias = process.env.CM_KEY_ALIAS;
  const keyPassword = process.env.CM_KEY_PASSWORD;

  if (keystorePath && keystorePassword && keyAlias && keyPassword && fs.existsSync(keystorePath)) {
    const keyPropsPath = path.join(androidDir, 'key.properties');
    fs.writeFileSync(
      keyPropsPath,
      [
        `storePassword=${keystorePassword}`,
        `keyPassword=${keyPassword}`,
        `keyAlias=${keyAlias}`,
        `storeFile=${keystorePath}`,
      ].join('\n') + '\n',
      'utf8'
    );

    if (isKts && !gradle.includes('key.properties')) {
      const signingImport = 'import java.util.Properties\nimport java.io.FileInputStream\n\n';
      if (!gradle.includes('import java.util.Properties')) {
        gradle = signingImport + gradle;
      }
      const signingBlock = `
    signingConfigs {
        create("release") {
            val props = Properties()
            val propsFile = rootProject.file("key.properties")
            if (propsFile.exists()) {
                props.load(FileInputStream(propsFile))
                storeFile = file(props.getProperty("storeFile"))
                storePassword = props.getProperty("storePassword")
                keyAlias = props.getProperty("keyAlias")
                keyPassword = props.getProperty("keyPassword")
            }
        }
    }
`;
      gradle = gradle.replace(/buildTypes\s*\{/, `${signingBlock}\n    buildTypes {`);
      gradle = gradle.replace(
        /signingConfig\s*=\s*signingConfigs\.getByName\("debug"\)/,
        'signingConfig = signingConfigs.getByName("release")'
      );
      console.log('Configured release signing from Codemagic keystore');
    }
  } else {
    console.log('No CM_KEYSTORE_* env vars provided; using Flutter default signing configuration.');
  }

  fs.writeFileSync(gradlePath, gradle, 'utf8');
  console.log(`Configured ${path.basename(gradlePath)} (com.blockclash.game, minSdk >= 21)`);
}

function installLauncherIcons() {
  const iconCandidates = [
    path.join(rootDir, 'store', 'play_icon_512.png'),
    path.join(rootDir, 'assets', 'branding', 'logo.png'),
    path.join(rootDir, 'public', 'logo.png'),
  ];
  const srcIcon = iconCandidates.find((p) => fs.existsSync(p));
  if (!srcIcon || !fs.existsSync(resDir)) return;

  const mipmapDirs = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
  let updated = 0;
  for (const dir of mipmapDirs) {
    const destDir = path.join(resDir, dir);
    if (fs.existsSync(destDir)) {
      fs.copyFileSync(srcIcon, path.join(destDir, 'ic_launcher.png'));
      updated++;
    }
  }
  console.log(`Copied Block Clash launcher icon to ${updated} Android mipmap directories`);
}

patchManifest();
patchGradle();
installLauncherIcons();
