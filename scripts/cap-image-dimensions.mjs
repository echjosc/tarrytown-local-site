// Runs before every build. Content is uploaded through Keystatic straight from
// whatever camera/phone an editor used, with no resizing step in that flow —
// so oversized source photos (multi-megapixel camera originals) are expected,
// not a one-off mistake. This keeps every build fast and every deploy small
// regardless of what gets uploaded.
import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const IMAGES_DIR = new URL('../src/assets/images/', import.meta.url).pathname;
const MAX_DIMENSION = 3200; // longest edge, in px — covers the largest size any <Img> in this repo requests (2x density of a 1600px-wide hero)
const RASTER_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

async function* walk(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walk(path);
		} else if (RASTER_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
			yield path;
		}
	}
}

let capped = 0;
for await (const path of walk(IMAGES_DIR)) {
	const image = sharp(path);
	const { width, height } = await image.metadata();
	if (!width || !height || Math.max(width, height) <= MAX_DIMENSION) continue;

	const beforeSize = (await stat(path)).size;
	const buffer = await image.resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true }).toBuffer();
	await sharp(buffer).toFile(path);
	const afterSize = (await stat(path)).size;

	console.log(
		`[cap-image-dimensions] ${path.replace(IMAGES_DIR, '')}: ${width}x${height} -> capped to ${MAX_DIMENSION}px (${(beforeSize / 1024 / 1024).toFixed(1)}MB -> ${(afterSize / 1024 / 1024).toFixed(1)}MB)`
	);
	capped++;
}

if (capped > 0) {
	console.log(`[cap-image-dimensions] Capped ${capped} oversized image(s).`);
}
