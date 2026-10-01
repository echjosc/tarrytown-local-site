// Runs before every build. Editors upload menus through Keystatic exactly as
// before — this just notices when that upload is a PDF and (a) tries to turn
// it into structured categories/items, so the site can render real HTML
// instead of embedding the PDF, and (b) always renders a screenshot of the
// first page, so that even when structured parsing doesn't apply (skipped or
// nothing parseable) the page shows a plain image instead of an embedded PDF
// viewer. If a section isn't a PDF, no files are written and the page falls
// back to the image embed it already supports.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createReader } from '@keystatic/core/reader';
import { PDFParse } from 'pdf-parse';
import keystaticConfig from '../keystatic.config.ts';
import { parseMenuText } from './lib/parse-menu-text.mjs';

const PUBLIC_DIR = new URL('../public', import.meta.url);
const OUTPUT_DIR = new URL('../src/data/generated/menu/', import.meta.url);
const SCREENSHOT_DIR = new URL('../public/menus/generated/', import.meta.url);

const MENU_SECTIONS = [
	{ key: 'restaurantMenu', outputFile: 'restaurant-menu.json', screenshotFile: 'restaurant-menu.png' },
	{ key: 'bakeryMenu', outputFile: 'bakery-menu.json', screenshotFile: 'bakery-menu.png' },
];

const reader = createReader(process.cwd(), keystaticConfig);

await mkdir(OUTPUT_DIR, { recursive: true });
await mkdir(SCREENSHOT_DIR, { recursive: true });

for (const { key, outputFile, screenshotFile } of MENU_SECTIONS) {
	const outputUrl = new URL(outputFile, OUTPUT_DIR);
	const screenshotUrl = new URL(screenshotFile, SCREENSHOT_DIR);
	const section = await reader.singletons[key].read();
	const display = section?.display;
	const fileUrl = display?.value?.file;

	if (display?.discriminant !== 'file') {
		await rm(outputUrl, { force: true });
		await rm(screenshotUrl, { force: true });
		continue;
	}

	if (!fileUrl?.toLowerCase().endsWith('.pdf')) {
		if (fileUrl) {
			console.log(`[parse-menu-pdfs] ${key}: ${fileUrl} isn't a PDF — showing it as-is.`);
		}
		await rm(outputUrl, { force: true });
		await rm(screenshotUrl, { force: true });
		continue;
	}

	const pdfPath = new URL(`.${fileUrl}`, `${PUBLIC_DIR}/`);
	let buffer;
	try {
		buffer = await readFile(pdfPath);
	} catch (err) {
		console.warn(`[parse-menu-pdfs] ${key}: couldn't read ${fileUrl} (${err.message}) — skipping.`);
		await rm(outputUrl, { force: true });
		await rm(screenshotUrl, { force: true });
		continue;
	}

	const parser = new PDFParse({ data: new Uint8Array(buffer) });
	try {
		try {
			const { pages } = await parser.getScreenshot({ partial: [1], scale: 2, imageBuffer: true, imageDataUrl: false });
			const page = pages[0];
			if (page?.data) {
				await writeFile(screenshotUrl, page.data);
				console.log(`[parse-menu-pdfs] ${key}: rendered a page image from ${fileUrl}.`);
			} else {
				throw new Error('no page image returned');
			}
		} catch (err) {
			console.warn(`[parse-menu-pdfs] ${key}: couldn't render a page image from ${fileUrl} (${err.message}) — falling back to the raw PDF embed.`);
			await rm(screenshotUrl, { force: true });
		}

		if (display.value?.skipPdfParse) {
			console.log(`[parse-menu-pdfs] ${key}: auto-parsing is turned off for this file — showing the rendered image as-is.`);
			await rm(outputUrl, { force: true });
			continue;
		}

		const { text } = await parser.getText();
		const parsed = parseMenuText(text);
		if (parsed.categories.length === 0) {
			console.warn(`[parse-menu-pdfs] ${key}: found nothing parseable in ${fileUrl} — falling back to the rendered image.`);
			await rm(outputUrl, { force: true });
			continue;
		}

		await writeFile(outputUrl, JSON.stringify(parsed, null, '\t'));
		console.log(`[parse-menu-pdfs] ${key}: parsed ${parsed.categories.length} categories from ${fileUrl}.`);
	} finally {
		await parser.destroy();
	}
}
