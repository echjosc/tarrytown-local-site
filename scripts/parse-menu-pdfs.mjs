// Runs before every build. Editors upload menus through Keystatic exactly as
// before — this just notices when that upload is a PDF and turns it into
// structured categories/items, so the site can render real HTML instead of
// embedding the PDF. If a section isn't a PDF, or the PDF doesn't parse into
// anything usable, no file is written and the page falls back to the raw
// PDF/image embed it already supports.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createReader } from '@keystatic/core/reader';
import { PDFParse } from 'pdf-parse';
import keystaticConfig from '../keystatic.config.ts';
import { parseMenuText } from './lib/parse-menu-text.mjs';

const PUBLIC_DIR = new URL('../public', import.meta.url);
const OUTPUT_DIR = new URL('../src/data/generated/menu/', import.meta.url);

const MENU_SECTIONS = [
	{ key: 'restaurantMenu', outputFile: 'restaurant-menu.json' },
	{ key: 'bakeryMenu', outputFile: 'bakery-menu.json' },
];

const reader = createReader(process.cwd(), keystaticConfig);
const menuPage = await reader.singletons.menuPage.read();

await mkdir(OUTPUT_DIR, { recursive: true });

for (const { key, outputFile } of MENU_SECTIONS) {
	const outputUrl = new URL(outputFile, OUTPUT_DIR);
	const section = menuPage?.[key];
	const display = section?.display;
	const fileUrl = display?.value?.file;

	if (display?.discriminant !== 'file' || !fileUrl?.toLowerCase().endsWith('.pdf')) {
		await rm(outputUrl, { force: true });
		continue;
	}

	if (display.value?.skipPdfParse) {
		console.log(`[parse-menu-pdfs] ${key}: auto-parsing is turned off for this file — showing the PDF as-is.`);
		await rm(outputUrl, { force: true });
		continue;
	}

	const pdfPath = new URL(`.${fileUrl}`, `${PUBLIC_DIR}/`);
	let buffer;
	try {
		buffer = await readFile(pdfPath);
	} catch (err) {
		console.warn(`[parse-menu-pdfs] ${key}: couldn't read ${fileUrl} (${err.message}) — skipping.`);
		await rm(outputUrl, { force: true });
		continue;
	}

	const parser = new PDFParse({ data: new Uint8Array(buffer) });
	let text;
	try {
		({ text } = await parser.getText());
	} finally {
		await parser.destroy();
	}

	const parsed = parseMenuText(text);
	if (parsed.categories.length === 0) {
		console.warn(`[parse-menu-pdfs] ${key}: found nothing parseable in ${fileUrl} — falling back to the PDF embed.`);
		await rm(outputUrl, { force: true });
		continue;
	}

	await writeFile(outputUrl, JSON.stringify(parsed, null, '\t'));
	console.log(`[parse-menu-pdfs] ${key}: parsed ${parsed.categories.length} categories from ${fileUrl}.`);
}
