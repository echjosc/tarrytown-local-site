// Turns plain text extracted from a menu PDF into structured categories/items,
// matching the shape of Keystatic's "Fill in the menu" fields. Tuned to the
// client's template: "[header row]" to ignore, short lowercase category labels
// ("lunch", "dessert"), "Name | $Price" item lines each followed by an italic
// description line, and a closing sourcing blurb after the last item.
// Dates show up as either "MM.DD.YYYY" (or the older 2-digit-year "M.D.YY")
// or, on newer menus with no day, "MM.YYYY". Captured separately below so the
// value can be kept instead of just discarded along with the rest of the line.
const DATE_RE = /\b\d{1,2}\.(?:\d{1,2}\.)?\d{2,4}\b/;
const HEADER_LINE_RE = new RegExp(`[[\\]]|${DATE_RE.source}`);
// pdf-parse inserts a "-- N of M --" marker between pages — not real content.
const PAGE_MARKER_RE = /^--\s*\d+\s*of\s*\d+\s*--$/;
// Some PDF fonts remap the "|" separator glyph so it extracts as a standalone
// capital "I" instead (e.g. "Dish Name I $13") — accept either. Some menus use
// a plain dash instead (e.g. "Dish Name - $13"); that's only accepted with a
// space on both sides, so a hyphenated word in the name (e.g. "Bi-Color
// Beans") can't be misread as the separator.
const ITEM_LINE_RE = /^(.+?)(?:\s*\||\s*\bI\b|\s[-‒–—]\s)\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*$/;
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
	const trimmedLines = rawText
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	const date = trimmedLines.map((line) => line.match(DATE_RE)?.[0]).find(Boolean);

	const lines = trimmedLines.filter((line) => !HEADER_LINE_RE.test(line) && !PAGE_MARKER_RE.test(line));

	const categories = [];
	const footerLines = [];
	let currentCategory = null;
	let lastItem = null;
	let expectingDescription = false;
	let inFooter = false;

	for (const line of lines) {
		if (inFooter) {
			// A page layout can place a category label (e.g. "lunch") out of
			// reading order so it extracts after the closing blurb instead of
			// before the items it belongs to — don't let that stray word tack
			// itself onto the end of the note's prose.
			if (!isHeadingCandidate(line)) {
				footerLines.push(line);
			}
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
		date,
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
	let date;

	for (const { date: pageDate, note, categories: pageCategories } of pageResults) {
		if (!date && pageDate) date = pageDate;
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
		date,
		note: noteParts.join(' ').replace(/\s+/g, ' ').trim() || undefined,
		categories,
	};
}
