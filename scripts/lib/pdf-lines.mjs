// Turns the text fragments pdf.js finds on one PDF page into lines of text in
// the order they appear on the page (top to bottom, left to right).
//
// pdf.js returns fragments in the order they were written into the PDF file,
// which is not the order you see them. Editing a menu in a PDF editor appends
// new text at the end of that order, so a heading or item added later would
// come out after the closing blurb. Sorting by position avoids depending on it.
//
// Lines that wrap are joined back into one: a line directly under another in
// the same font and size is a continuation (a long description running onto a
// second line), which a menu parser would otherwise mistake for new content.

// Fragments whose baselines are within this fraction of the font height share a row.
const SAME_ROW_TOLERANCE = 0.5;
// A row this close under the previous one (as a multiple of the font height) is a wrapped line.
const WRAP_GAP_RATIO = 1.8;
const WRAP_HEIGHT_TOLERANCE = 0.5;
// Fragments on one row further apart than this fraction of the font height get a space between them.
const WORD_GAP_RATIO = 0.1;

export function linesFromTextItems(items) {
	const fragments = items
		.filter((item) => typeof item.str === 'string' && item.str.trim().length > 0)
		.map((item) => ({
			text: item.str,
			x: item.transform[4],
			y: item.transform[5],
			width: item.width,
			height: item.height,
			fontName: item.fontName,
		}))
		// PDF y coordinates grow upward, so the top of the page has the largest y.
		.sort((a, b) => b.y - a.y || a.x - b.x);

	const rows = [];
	for (const fragment of fragments) {
		const row = rows[rows.length - 1];
		if (row && Math.abs(row.y - fragment.y) <= SAME_ROW_TOLERANCE * Math.max(row.height, fragment.height)) {
			row.fragments.push(fragment);
		} else {
			rows.push({ y: fragment.y, height: fragment.height, fragments: [fragment] });
		}
	}

	const lines = [];
	for (const row of rows) {
		row.fragments.sort((a, b) => a.x - b.x);
		const first = row.fragments[0];
		const line = {
			text: joinRowFragments(row.fragments),
			y: row.y,
			height: first.height,
			fontName: first.fontName,
		};

		const previous = lines[lines.length - 1];
		if (previous && isWrappedLine(previous, line)) {
			previous.text = `${previous.text} ${line.text}`;
			previous.y = line.y;
		} else {
			lines.push(line);
		}
	}

	return lines.map((line) => line.text);
}

function joinRowFragments(fragments) {
	let text = '';
	let previous = null;
	for (const fragment of fragments) {
		if (previous) {
			const gap = fragment.x - (previous.x + previous.width);
			const spaceAlready = /\s$/.test(previous.text) || /^\s/.test(fragment.text);
			if (gap > WORD_GAP_RATIO * fragment.height && !spaceAlready) text += ' ';
		}
		text += fragment.text;
		previous = fragment;
	}
	return text.replace(/\s+/g, ' ').trim();
}

function isWrappedLine(previous, line) {
	const gap = previous.y - line.y;
	return (
		previous.fontName === line.fontName &&
		Math.abs(previous.height - line.height) < WRAP_HEIGHT_TOLERANCE &&
		gap > 0 &&
		gap <= WRAP_GAP_RATIO * line.height
	);
}
