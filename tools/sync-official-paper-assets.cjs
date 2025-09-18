const fs = require('fs');
const path = require('path');

const SOURCE_IMAGES_DIR = path.resolve(__dirname, '..', 'scripts', 'paper_colors', 'official_images');
const DEST_IMAGES_DIR = path.resolve(__dirname, '..', 'public', 'official_images');

async function copyOfficialImages() {
  try {
    await fs.promises.access(SOURCE_IMAGES_DIR);
  } catch (error) {
    console.warn('[paper-assets] Source directory not found:', SOURCE_IMAGES_DIR);
    return 0;
  }

  await fs.promises.mkdir(DEST_IMAGES_DIR, { recursive: true });
  const entries = await fs.promises.readdir(SOURCE_IMAGES_DIR, { withFileTypes: true });
  let copied = 0;

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    const sourcePath = path.join(SOURCE_IMAGES_DIR, entry.name);
    const destPath = path.join(DEST_IMAGES_DIR, entry.name);
    await fs.promises.copyFile(sourcePath, destPath);
    copied += 1;
  }

  return copied;
}

async function main() {
  const copiedCount = await copyOfficialImages();
  console.log(`[paper-assets] Synced ${copiedCount} official paper textures to "${DEST_IMAGES_DIR}"`);
}

main().catch((error) => {
  console.error('[paper-assets] Failed to sync official paper textures', error);
  process.exit(1);
});
