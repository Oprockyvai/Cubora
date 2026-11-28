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

  // AdMob application id (required by the Mobile Ads SDK, otherwise the app crashes on launch).
  // Not a secret; override with ADMOB_APP_ID. The default is the Block Clash AdMob app.
  const admobAppId = process.env.ADMOB_APP_ID || 'ca-app-pub-4704475463086875~5892914831';
  if (!/^ca-app-pub-\d{16}~\d{10}$/.test(admobAppId)) {
    throw new Error(`Invalid ADMOB_APP_ID: ${admobAppId}`);
  }
  if (!xml.includes('com.google.android.gms.ads.APPLICATION_ID')) {
    xml = xml.replace(
      '</application>',
      `    <meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="${admobAppId}"/>\n    </application>`
    );
  }

  // Ads need the network (the Mobile Ads SDK also merges these, but be explicit).
  for (const perm of ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE']) {
    if (!xml.includes(perm)) {
      xml = xml.replace(/<manifest\b[^>]*>/, (m) => `${m}\n    <uses-permission android:name="${perm}"/>`);
    }
  }

  fs.writeFileSync(manifestPath, xml, 'utf8');
  console.log('Configured AndroidManifest.xml (Block Clash, portrait, AdMob app id, network permissions)');
}

function patchGradle() {
  const isKts = fs.existsSync(gradleKtsPath);
  const gradlePath = isKts ? gradleKtsPath : gradleGroovyPath;
  if (!fs.existsSync(gradlePath)) {
    throw new Error('Missing android/app/build.gradle(.kts)');
  }

  let gradle = fs.readFileSync(gradlePath, 'utf8');

  // Enforce clean applicationId and minSdk >= 23 (required by the Mobile Ads SDK)
  if (isKts) {
    gradle = gradle.replace(/applicationId\s*=\s*"[^"]*"/, 'applicationId = "cubora.blockclash.game"');
    gradle = gradle.replace(/minSdk\s*=\s*flutter\.minSdkVersion/, 'minSdk = maxOf(flutter.minSdkVersion, 23)');
  } else {
    gradle = gradle.replace(/applicationId\s+["'][^"']*["']/, 'applicationId "cubora.blockclash.game"');
    gradle = gradle.replace(/minSdkVersion\s+flutter\.minSdkVersion/, 'minSdkVersion Math.max(flutter.minSdkVersion, 23)');
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
  console.log(`Configured ${path.basename(gradlePath)} (cubora.blockclash.game, minSdk >= 23)`);
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
