import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMenuText } from './parse-menu-text.mjs';

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
