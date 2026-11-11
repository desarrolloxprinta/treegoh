/**
 * ==============================================================================
 * Treegoh Botanical Sanctuary - Official App Icon Generator & Synchronizer
 * ==============================================================================
 * Generates the official native application icons from the master branding asset:
 *   - Source: /branding/favicon.png (Official Treegoh wordmark & leaf texture)
 *   - Target Assets:
 *       * assets/icon.png (1024x1024 full-bleed opaque #E6E8C4 for iOS App Store)
 *       * assets/favicon.png (48x48 for Web / Expo)
 *       * assets/android-icon-background.png (1024x1024 solid #E6E8C4)
 *       * assets/android-icon-foreground.png (1024x1024 centered safe-zone graphic)
 *       * assets/branding-favicon.png (Repository internal persistence)
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const Jimp = require('jimp-compact');

const APP_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(APP_DIR, 'assets');
const BRANDING_DIR = path.join(APP_DIR, '../branding');

// Official Treegoh brand background color: #E6E8C4 (Pistachio / Pale Sage)
// RGBA uint32 representation in Jimp: 0xE6E8C4FF
const BRAND_BG_HEX = 0xE6E8C4FF;

const CANDIDATE_SOURCES = [
  path.join(BRANDING_DIR, 'favicon.png'),
  path.join(ASSETS_DIR, 'branding-favicon.png'),
  path.join(ASSETS_DIR, 'favicon.png'),
  // Windows direct path fallback
  'C:\\Users\\Usuario\\ruy-projects\\treegoh\\branding\\favicon.png',
  '/mnt/c/Users/Usuario/ruy-projects/treegoh/branding/favicon.png'
];

async function run() {
  console.log('🌿 [Treegoh] Iniciando sincronización del icono oficial desde /branding...');

  // Locate the master branding icon
  let sourcePath = null;
  for (const candidate of CANDIDATE_SOURCES) {
    if (fs.existsSync(candidate)) {
      sourcePath = candidate;
      break;
    }
  }

  if (!sourcePath) {
    console.warn('⚠️ [Treegoh] No se encontró el archivo maestro de branding en ninguna de las rutas esperadas:');
    CANDIDATE_SOURCES.forEach(c => console.warn(`   - ${c}`));
    return;
  }

  console.log(`✨ [Treegoh] Archivo maestro oficial de branding localizado en: ${sourcePath}`);

  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // Backup master branding asset into app/assets/branding-favicon.png for repo persistence
  const repoBackup = path.join(ASSETS_DIR, 'branding-favicon.png');
  if (sourcePath !== repoBackup) {
    try {
      fs.copyFileSync(sourcePath, repoBackup);
      console.log('💾 [Treegoh] Copiado branding oficial a assets/branding-favicon.png para Git.');
    } catch (e) {
      console.warn('⚠️ [Treegoh] No se pudo copiar a branding-favicon.png:', e.message);
    }
  }

  // Read master icon with Jimp
  const masterFavicon = await Jimp.read(sourcePath);
  const width = masterFavicon.getWidth();
  const height = masterFavicon.getHeight();
  console.log(`📐 [Treegoh] Imagen de branding cargada: ${width}x${height} px.`);

  // 1. Generate icon.png (1024x1024 full bleed, solid #E6E8C4, strictly NO alpha transparency for iOS)
  // Apple App Store strictly rejects icons with alpha channel (ERROR ITMS-90717).
  // We composite the branding graphic over a solid #E6E8C4 1024x1024 canvas so the rounded corners
  // blend into the background seamlessly, creating a 100% opaque square canvas.
  const iconPath = path.join(ASSETS_DIR, 'icon.png');
  const solidBg = new Jimp(1024, 1024, BRAND_BG_HEX);
  const scaledFavicon = masterFavicon.clone().resize(1024, 1024, Jimp.RESIZE_BICUBIC);
  solidBg.composite(scaledFavicon, 0, 0);
  await solidBg.writeAsync(iconPath);
  console.log(`✅ [Treegoh] Generado assets/icon.png (1024x1024 PNG sólido sin transparencia, conforme a Apple iOS)`);

  // 2. Generate favicon.png (48x48 PNG for Web / Expo)
  const faviconPath = path.join(ASSETS_DIR, 'favicon.png');
  const faviconImg = solidBg.clone().resize(48, 48, Jimp.RESIZE_BICUBIC);
  await faviconImg.writeAsync(faviconPath);
  console.log(`✅ [Treegoh] Generado assets/favicon.png (48x48 PNG)`);

  // 3. Generate android-icon-background.png (1024x1024 solid #E6E8C4)
  const bgPath = path.join(ASSETS_DIR, 'android-icon-background.png');
  const androidBg = new Jimp(1024, 1024, BRAND_BG_HEX);
  await androidBg.writeAsync(bgPath);
  console.log(`✅ [Treegoh] Generado assets/android-icon-background.png (1024x1024 #E6E8C4)`);

  // 4. Generate android-icon-foreground.png (1024x1024 with emblem centered in 72% safe zone)
  const fgPath = path.join(ASSETS_DIR, 'android-icon-foreground.png');
  const fgCanvas = new Jimp(1024, 1024, 0x00000000); // transparent base for adaptive icon
  const safeAreaGraphic = masterFavicon.clone().resize(740, 740, Jimp.RESIZE_BICUBIC);
  // (1024 - 740) / 2 = 142
  fgCanvas.composite(safeAreaGraphic, 142, 142);
  await fgCanvas.writeAsync(fgPath);
  console.log(`✅ [Treegoh] Generado assets/android-icon-foreground.png (Centrado en zona segura 72%)`);

  console.log('🎉 [Treegoh] ¡Todos los iconos oficiales de branding de Treegoh han sido sincronizados con éxito!');
}

if (require.main === module) {
  run().catch(err => {
    console.error('❌ [Treegoh] Error al generar los iconos oficiales:', err);
    process.exit(1);
  });
} else {
  run().catch(err => {
    console.warn('⚠️ [Treegoh] Aviso en sincronización en segundo plano:', err.message);
  });
}

module.exports = { run };
