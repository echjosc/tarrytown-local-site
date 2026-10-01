// Turns plain text extracted from a menu PDF into structured categories/items,
// matching the shape of Keystatic's "Fill in the menu" fields. Tuned to the
// client's template: "[header row]" to ignore, short lowercase category labels
// ("lunch", "dessert"), "Name | $Price" item lines each followed by an italic
// description line, and a closing sourcing blurb after the last item.
const HEADER_LINE_RE = /[[\]]|\d{1,2}\.\d{1,2}\.\d{2,4}/;
const ITEM_LINE_RE = /^(.+?)\s*\|\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*$/;
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
		.filter((line) => line.length > 0 && !HEADER_LINE_RE.test(line));

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
