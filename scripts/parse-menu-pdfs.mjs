// Runs before every build. Editors upload menus through Keystatic exactly as
// before — this just notices when that upload is a PDF and (a) tries to turn
// it into structured categories/items, so the site can render real HTML
// instead of embedding the PDF, and (b) always renders a screenshot of every
// page, so that even when structured parsing doesn't apply (skipped or
// nothing parseable) the page shows plain images instead of an embedded PDF
// viewer. If a section isn't a PDF, no files are written and the page falls
// back to the image embed it already supports.
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createReader } from '@keystatic/core/reader';
import { PDFParse } from 'pdf-parse';
import keystaticConfig from '../keystatic.config.ts';
import { parseMenuText, mergeMenuPages } from './lib/parse-menu-text.mjs';

const PUBLIC_DIR = new URL('../public', import.meta.url);
const OUTPUT_DIR = new URL('../src/data/generated/menu/', import.meta.url);
const SCREENSHOT_DIR = new URL('../public/menus/generated/', import.meta.url);

const MENU_SECTIONS = [
	{ key: 'restaurantMenu', outputFile: 'restaurant-menu.json', screenshotBase: 'restaurant-menu' },
	{ key: 'bakeryMenu', outputFile: 'bakery-menu.json', screenshotBase: 'bakery-menu' },
];

async function clearScreenshots(screenshotBase) {
	const pattern = new RegExp(`^${screenshotBase}-\\d+\\.png$`);
	const entries = await readdir(SCREENSHOT_DIR).catch(() => []);
	await Promise.all(
		entries.filter((name) => pattern.test(name)).map((name) => rm(new URL(name, SCREENSHOT_DIR), { force: true }))
	);
}

const reader = createReader(process.cwd(), keystaticConfig);

await mkdir(OUTPUT_DIR, { recursive: true });
await mkdir(SCREENSHOT_DIR, { recursive: true });

for (const { key, outputFile, screenshotBase } of MENU_SECTIONS) {
	const outputUrl = new URL(outputFile, OUTPUT_DIR);
	const section = await reader.singletons[key].read();
	const display = section?.display;
	const fileUrl = display?.value?.file;

	if (display?.discriminant !== 'file') {
		await rm(outputUrl, { force: true });
		await clearScreenshots(screenshotBase);
		continue;
	}

	if (!fileUrl?.toLowerCase().endsWith('.pdf')) {
		if (fileUrl) {
			console.log(`[parse-menu-pdfs] ${key}: ${fileUrl} isn't a PDF — showing it as-is.`);
		}
		await rm(outputUrl, { force: true });
		await clearScreenshots(screenshotBase);
		continue;
	}

	const pdfPath = new URL(`.${fileUrl}`, `${PUBLIC_DIR}/`);
	let buffer;
	try {
		buffer = await readFile(pdfPath);
	} catch (err) {
		console.warn(`[parse-menu-pdfs] ${key}: couldn't read ${fileUrl} (${err.message}) — skipping.`);
		await rm(outputUrl, { force: true });
		await clearScreenshots(screenshotBase);
		continue;
	}

	const parser = new PDFParse({ data: new Uint8Array(buffer) });
	try {
		await clearScreenshots(screenshotBase);
		try {
			const { pages } = await parser.getScreenshot({ scale: 2, imageBuffer: true, imageDataUrl: false });
			if (pages.length === 0) throw new Error('no page images returned');
			await Promise.all(
				pages.map((page) => writeFile(new URL(`${screenshotBase}-${page.pageNumber}.png`, SCREENSHOT_DIR), page.data))
			);
			console.log(`[parse-menu-pdfs] ${key}: rendered ${pages.length} page image(s) from ${fileUrl}.`);
		} catch (err) {
			console.warn(`[parse-menu-pdfs] ${key}: couldn't render page images from ${fileUrl} (${err.message}) — falling back to the raw PDF embed.`);
			await clearScreenshots(screenshotBase);
		}

		if (display.value?.skipPdfParse) {
			console.log(`[parse-menu-pdfs] ${key}: auto-parsing is turned off for this file — showing the rendered image(s) as-is.`);
			await rm(outputUrl, { force: true });
			continue;
		}

		// Parsed per-page (not the whole-document concatenated text) so a stray
		// unrecognized line on one page can't swallow every later page's items.
		const { pages: textPages } = await parser.getText();
		const parsed = mergeMenuPages(textPages.map(({ text }) => parseMenuText(text)));
		if (parsed.categories.length === 0) {
			console.warn(`[parse-menu-pdfs] ${key}: found nothing parseable in ${fileUrl} — falling back to the rendered image(s).`);
			await rm(outputUrl, { force: true });
			continue;
		}

		await writeFile(outputUrl, JSON.stringify(parsed, null, '\t'));
		console.log(`[parse-menu-pdfs] ${key}: parsed ${parsed.categories.length} categories from ${fileUrl}.`);
	} finally {
		await parser.destroy();
	}
}
