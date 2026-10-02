import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMenuText, mergeMenuPages } from './parse-menu-text.mjs';

// Text as pdf-parse actually extracts it from a real PDF built from the
// client's template (verified against a generated fixture) — blank lines are
// not preserved, and the closing note gets hard-wrapped mid-word.
const REAL_EXTRACTED_TEXT = `[restaurant] \t9.15.26 | Tarrytown Local
lunch
Adirondack Blue Vichyssoise | $13
Cold Potato Leek Soup with Deep Roots Farm Blue Potatoes
Tomatoes and Peaches | $13
Blue Corn Grits, Fermented Garlic Aioli, and Pickled Purslane
dessert
Ice Cream Sandwich | $12
Sorghum Cookie and Wapsie Valley Corn Ice Cream
We're proud to source our ingredients directly from local farms and to use the s
ame ingredients in the kitchen that we sell in the grocery.
Ask us where any ingredient came from and why it's special.`;

test('parses categories, items, descriptions, and prices from real extracted text', () => {
	const result = parseMenuText(REAL_EXTRACTED_TEXT);

	assert.deepEqual(result.categories, [
		{
			name: 'Lunch',
			items: [
				{
					name: 'Adirondack Blue Vichyssoise',
					price: '$13',
					description: 'Cold Potato Leek Soup with Deep Roots Farm Blue Potatoes',
				},
				{
					name: 'Tomatoes and Peaches',
					price: '$13',
					description: 'Blue Corn Grits, Fermented Garlic Aioli, and Pickled Purslane',
				},
			],
		},
		{
			name: 'Dessert',
			items: [
				{
					name: 'Ice Cream Sandwich',
					price: '$12',
					description: 'Sorghum Cookie and Wapsie Valley Corn Ice Cream',
				},
			],
		},
	]);
});

test('collects the trailing sourcing blurb as a single note, ignoring the header', () => {
	const result = parseMenuText(REAL_EXTRACTED_TEXT);

	assert.match(result.note, /^We're proud to source/);
	assert.match(result.note, /special\.$/);
	assert.doesNotMatch(result.note, /restaurant/);
	assert.doesNotMatch(result.note, /9\.15\.26/);
});

test('an item with no description line is still captured, without borrowing the next line', () => {
	const text = `lunch
Soup | $9
Salad | $10
Kale, quinoa, and a lemon vinaigrette`;

	const result = parseMenuText(text);

	assert.deepEqual(result.categories[0].items, [
		{ name: 'Soup', price: '$9' },
		{ name: 'Salad', price: '$10', description: 'Kale, quinoa, and a lemon vinaigrette' },
	]);
});

test('items appearing before any category heading fall into a default "Menu" category', () => {
	const text = `Soup | $9
A warm start`;

	const result = parseMenuText(text);

	assert.equal(result.categories[0].name, 'Menu');
	assert.equal(result.categories[0].items[0].name, 'Soup');
});

test('returns no categories and no note for text with nothing parseable', () => {
	const result = parseMenuText('[restaurant]\n9.15.26 | Tarrytown Local');

	assert.deepEqual(result.categories, []);
	assert.equal(result.note, undefined);
});

// Some PDF fonts remap the "|" separator glyph so pdf-parse extracts it as a
// standalone capital "I" instead — seen on a real client upload.
test('parses items whose "|" separator extracted as a standalone "I"', () => {
	const text = `lunch
Adirondack Blue Vichyssoise I $13
Cold Potato Leek Soup with Deep Roots Farm Blue Potatoes`;

	const result = parseMenuText(text);

	assert.deepEqual(result.categories, [
		{
			name: 'Lunch',
			items: [
				{
					name: 'Adirondack Blue Vichyssoise',
					price: '$13',
					description: 'Cold Potato Leek Soup with Deep Roots Farm Blue Potatoes',
				},
			],
		},
	]);
});

test('strips a "MM.YYYY" dated header line, not just the older "M.D.YY" format', () => {
	const result = parseMenuText('[restaurant]\n10.2026 | Tarrytown Local');

	assert.deepEqual(result.categories, []);
	assert.equal(result.note, undefined);
});

test('captures the menu date out of the header line instead of just discarding it', () => {
	const result = parseMenuText(REAL_EXTRACTED_TEXT);

	assert.equal(result.date, '9.15.26');
});

test('captures a "MM.YYYY" date (no day) as well as "MM.DD.YYYY"', () => {
	assert.equal(parseMenuText('[restaurant]\n10.2026 | Tarrytown Local').date, '10.2026');
	assert.equal(parseMenuText('[restaurant]\n10.15.2026 | Tarrytown Local').date, '10.15.2026');
});

test('date is undefined when the header has no date-shaped text', () => {
	const result = parseMenuText('lunch\nSoup | $9');

	assert.equal(result.date, undefined);
});

// Seen on a real client upload: the page's "lunch" label extracts after the
// closing blurb instead of before the items (a layout quirk in how the PDF
// was built), and shouldn't be tacked onto the end of the note's prose.
test('a stray category label that extracts after the note is dropped, not appended to it', () => {
	const text = `lunch
Soup | $9
A warm start
We're proud to source our ingredients directly from local farms.
lunch`;

	const result = parseMenuText(text);

	assert.equal(result.note, "We're proud to source our ingredients directly from local farms.");
});

test('mergeMenuPages carries the date through from whichever page has it', () => {
	const page1 = parseMenuText('[restaurant]\n10.2026 | Tarrytown Local\nlunch\nSoup | $9');
	const page2 = parseMenuText('dessert\nPie | $7');

	const result = mergeMenuPages([page1, page2]);

	assert.equal(result.date, '10.2026');
});

// Seen on a real client upload: most items use "-" instead of "|" before the
// price, and a hyphenated word in a description line must not be mistaken for
// the separator.
test('parses items whose separator is a plain dash instead of "|"', () => {
	const text = `lunch
Thousand Leaf Garden Tomato Salad - $17
Ardith Mae Chevre, Apple Balsamic, Roasted Peppers
Lil' Fishies From The Garden | $17
Bi-Color Beans, Stick With Grandma Beer Batter, Pumpkin Seed Vinaigrette`;

	const result = parseMenuText(text);

	assert.deepEqual(result.categories, [
		{
			name: 'Lunch',
			items: [
				{
					name: 'Thousand Leaf Garden Tomato Salad',
					price: '$17',
					description: 'Ardith Mae Chevre, Apple Balsamic, Roasted Peppers',
				},
				{
					name: "Lil' Fishies From The Garden",
					price: '$17',
					description: 'Bi-Color Beans, Stick With Grandma Beer Batter, Pumpkin Seed Vinaigrette',
				},
			],
		},
	]);
});

test('a hyphenated word on its own, with no price, is not mistaken for a dash-separated item', () => {
	const text = `lunch
Golden Beet Soup - $15
Bi-Color Beans and Grains`;

	const result = parseMenuText(text);

	assert.deepEqual(result.categories[0].items, [
		{ name: 'Golden Beet Soup', price: '$15', description: 'Bi-Color Beans and Grains' },
	]);
});

test('strips the "-- N of M --" page marker pdf-parse inserts between pages', () => {
	const text = `lunch
Soup | $9
A warm start
-- 1 of 1 --`;

	const result = parseMenuText(text);

	assert.equal(result.categories[0].items[0].name, 'Soup');
	assert.equal(result.note, undefined);
});

// A multi-page PDF is parsed one page at a time, then merged — parsing the
// whole document as one concatenated string would mean a page-1 footer line
// (a folio, a page number) flips parseMenuText into "note" mode and silently
// swallows every item from page 2 onward.
test('mergeMenuPages keeps page 2 even when page 1 ends with unrecognized trailing text', () => {
	const page1 = parseMenuText(`lunch
Soup | $9
Kale, quinoa, and a lemon vinaigrette
Printed fresh daily on recycled paper`);
	const page2 = parseMenuText(`dessert
Pie | $7
Apples, cinnamon, and a flaky crust`);

	const result = mergeMenuPages([page1, page2]);

	assert.deepEqual(result.categories, [
		{ name: 'Lunch', items: [{ name: 'Soup', price: '$9', description: 'Kale, quinoa, and a lemon vinaigrette' }] },
		{ name: 'Dessert', items: [{ name: 'Pie', price: '$7', description: 'Apples, cinnamon, and a flaky crust' }] },
	]);
	assert.match(result.note, /Printed fresh daily/);
});

test('mergeMenuPages combines a category split across a page break', () => {
	const page1 = parseMenuText(`lunch
Soup | $9
Kale, quinoa, and a lemon vinaigrette`);
	const page2 = parseMenuText(`lunch
Salad | $10
Apples, cinnamon, and a flaky crust`);

	const result = mergeMenuPages([page1, page2]);

	assert.deepEqual(result.categories, [
		{
			name: 'Lunch',
			items: [
				{ name: 'Soup', price: '$9', description: 'Kale, quinoa, and a lemon vinaigrette' },
				{ name: 'Salad', price: '$10', description: 'Apples, cinnamon, and a flaky crust' },
			],
		},
	]);
});
