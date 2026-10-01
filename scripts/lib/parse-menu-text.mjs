// Turns plain text extracted from a menu PDF into structured categories/items,
// matching the shape of Keystatic's "Fill in the menu" fields. Tuned to the
// client's template: "[header row]" to ignore, short lowercase category labels
// ("lunch", "dessert"), "Name | $Price" item lines each followed by an italic
// description line, and a closing sourcing blurb after the last item.
const HEADER_LINE_RE = /[[\]]|\d{1,2}\.\d{1,2}\.\d{2,4}/;
// pdf-parse inserts a "-- N of M --" marker between pages — not real content.
const PAGE_MARKER_RE = /^--\s*\d+\s*of\s*\d+\s*--$/;
// Some PDF fonts remap the "|" separator glyph so it extracts as a standalone
// capital "I" instead (e.g. "Dish Name I $13") — accept either.
const ITEM_LINE_RE = /^(.+?)\s*(?:\||\bI\b)\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*$/;
const SENTENCE_END_RE = /[.!?]$/;

function isHeadingCandidate(line) {
	const wordCount = line.split(/\s+/).filter(Boolean).length;
	return wordCount > 0 && wordCount <= 3 && !SENTENCE_END_RE.test(line) && !line.includes('|');
}

function titleCase(line) {
	return line
		.toLowerCase()
		.split(' ')
		.map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
		.join(' ');
}

export function parseMenuText(rawText) {
	const lines = rawText
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0 && !HEADER_LINE_RE.test(line) && !PAGE_MARKER_RE.test(line));

	const categories = [];
	const footerLines = [];
	let currentCategory = null;
	let lastItem = null;
	let expectingDescription = false;
	let inFooter = false;

	for (const line of lines) {
		if (inFooter) {
			footerLines.push(line);
			continue;
		}

		const itemMatch = line.match(ITEM_LINE_RE);
		if (itemMatch) {
			const [, name, price] = itemMatch;
			lastItem = { name: name.trim(), price: `$${price}` };
			if (!currentCategory) {
				currentCategory = { name: 'Menu', items: [] };
				categories.push(currentCategory);
			}
			currentCategory.items.push(lastItem);
			expectingDescription = true;
			continue;
		}

		if (expectingDescription && !isHeadingCandidate(line)) {
			lastItem.description = line;
			expectingDescription = false;
			continue;
		}
		expectingDescription = false;

		if (isHeadingCandidate(line)) {
			currentCategory = { name: titleCase(line), items: [] };
			categories.push(currentCategory);
			continue;
		}

		// Not an item, description, or short heading — this is trailing note text
		// (e.g. a sourcing blurb). Once it starts, treat everything remaining as
		// part of it rather than risking it gets carved up into fake categories.
		inFooter = true;
		footerLines.push(line);
	}

	const note = footerLines.join(' ').replace(/\s+/g, ' ').trim();

	return {
		note: note || undefined,
		categories: categories.filter((category) => category.items.length > 0),
	};
}

// For a multi-page PDF, each page is parsed on its own (see parse-menu-pdfs.mjs)
// rather than as one concatenated string — a stray non-matching line (a page
// footer, a folio number) would otherwise flip "inFooter" above and swallow
// every item on every later page into the note. This merges those per-page
// results back into one menu, joining a category split across a page break.
export function mergeMenuPages(pageResults) {
	const categories = [];
	const noteParts = [];

	for (const { note, categories: pageCategories } of pageResults) {
		if (note) noteParts.push(note);

		for (const category of pageCategories) {
			const last = categories[categories.length - 1];
			if (last && last.name === category.name) {
				last.items.push(...category.items);
			} else {
				categories.push({ name: category.name, items: [...category.items] });
			}
		}
	}

	return {
		note: noteParts.join(' ').replace(/\s+/g, ' ').trim() || undefined,
		categories,
	};
}
