import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { build as esbuild } from 'esbuild';

const rootDir = process.cwd();
const tmpBuildDir = path.join(rootDir, 'dist-android');
const androidGameDir = path.join(rootDir, 'assets', 'game');
const androidImgDir = path.join(androidGameDir, 'img');
const publicDir = path.join(rootDir, 'public');
const publicImgDir = path.join(publicDir, 'img');

function escapeInlineScript(code) {
  return code.replace(/<\/script/gi, '<\\/script');
}

function escapeInlineStyle(css) {
  return css.replace(/<\/style/gi, '<\\/style');
}

async function run() {
  fs.rmSync(tmpBuildDir, { recursive: true, force: true });

  const viteBin = path.join(rootDir, 'node_modules', '.bin', 'vite');
  execFileSync(viteBin, ['build', '--mode', 'android', '--outDir', 'dist-android'], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  const builtHtmlPath = path.join(tmpBuildDir, 'index.html');
  let html = fs.readFileSync(builtHtmlPath, 'utf8');

  // Remove external Google Fonts links so 100% offline Android WebView never stalls on DNS
  html = html.replace(
    /<link\b[^>]*href=["']https?:\/\/fonts\.g(?:oogleapis|static)\.com[^"']*["'][^>]*>\s*/gi,
    ''
  );

  // Inline built stylesheets so Android WebView file:// never hits CORS or missing asset links
  const cssMatches = [
    ...html.matchAll(
      /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi
    ),
  ];
  for (const match of cssMatches) {
    const href = match[1].replace(/^\.\//, '');
    const cssPath = path.join(tmpBuildDir, href);
    const cssContent = escapeInlineStyle(fs.readFileSync(cssPath, 'utf8'));
    html = html.replace(match[0], () => `<style>\n${cssContent}\n</style>`);
  }

  // Bundle the Vite module entry into a single classic IIFE script for file:// Android WebView
  const scriptMatches = [
    ...html.matchAll(
      /<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*><\/script>/gi
    ),
  ];
  const bundledScripts = [];
  for (const match of scriptMatches) {
    const src = match[1].replace(/^\.\//, '');
    const jsPath = path.join(tmpBuildDir, src);
    const result = await esbuild({
      entryPoints: [jsPath],
      bundle: true,
      format: 'iife',
      minify: true,
      write: false,
      define: {
        'import.meta.url': '""',
      },
    });
    const code = escapeInlineScript(result.outputFiles[0].text);
    bundledScripts.push(`<script>\n${code}\n</script>`);
    html = html.replace(match[0], '');
  }

  // Strip modulepreload links since everything is inlined
  html = html.replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*>\s*/gi, '');

  // Append classic IIFE script right before </body> so #root exists synchronously
  if (bundledScripts.length > 0) {
    html = html.replace('</body>', () => `${bundledScripts.join('\n')}\n</body>`);
  }

  if (!html.includes('<style>') || !html.includes('<script>')) {
    throw new Error('Offline Android bundle validation failed: missing inlined style or script');
  }

  // Clean and sync assets/game/img so stale files never linger
  fs.rmSync(androidImgDir, { recursive: true, force: true });
  fs.mkdirSync(androidImgDir, { recursive: true });
  const outHtmlPath = path.join(androidGameDir, 'index.html');
  fs.writeFileSync(outHtmlPath, html, 'utf8');

  // Sync image assets from public/img -> assets/game/img and public/logo.png -> assets/game/logo.png
  let copiedImgs = 0;
  if (fs.existsSync(publicImgDir)) {
    for (const file of fs.readdirSync(publicImgDir)) {
      const srcFile = path.join(publicImgDir, file);
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, path.join(androidImgDir, file));
        copiedImgs++;
      }
    }
  }

  const publicLogo = path.join(publicDir, 'logo.png');
  if (fs.existsSync(publicLogo)) {
    fs.copyFileSync(publicLogo, path.join(androidGameDir, 'logo.png'));
  }

  fs.rmSync(tmpBuildDir, { recursive: true, force: true });
  const sizeKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  console.log(
    `Synced offline Block Clash bundle to assets/game/index.html (${sizeKb} KB, ${copiedImgs} images)`
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
