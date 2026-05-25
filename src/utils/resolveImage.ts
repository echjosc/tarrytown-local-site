import type { ImageMetadata } from 'astro';

const images = import.meta.glob<{ default: ImageMetadata }>(
	'/src/assets/images/**/*.{jpg,jpeg,png,webp,avif,gif,svg}',
	{ eager: true }
);

/**
 * Resolves a Keystatic @assets image path to an ImageMetadata object
 * for use with Astro's <Image> component.
 *
 * Returns undefined if the path is empty or the file doesn't exist,
 * so callers can gracefully fall back to a placeholder or omit the image.
 */
export function resolveImage(path: string | null | undefined): ImageMetadata | undefined {
	if (!path) return undefined;
	const key = path.startsWith('@assets/')
		? path.replace('@assets/', '/src/assets/')
		: path;
	return images[key]?.default;
}
