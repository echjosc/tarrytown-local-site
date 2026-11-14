import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linesFromTextItems } from './pdf-lines.mjs';
import { parseMenuText } from './parse-menu-text.mjs';

// A fragment shaped like the ones pdf.js returns from page.getTextContent().
function fragment(str, x, y, { height = 13, fontName = 'item' } = {}) {
	return { str, width: str.length * height * 0.5, height, fontName, transform: [height, 0, 0, height, x, y] };
}
const describe = (str, x, y) => fragment(str, x, y, { height: 10, fontName: 'italic' });

test('orders fragments top to bottom regardless of the order they were stored in', () => {
	const lines = linesFromTextItems([
		fragment('last line', 50, 100),
		fragment('first line', 50, 700),
		fragment('middle line', 50, 400),
	]);

	assert.deepEqual(lines, ['first line', 'middle line', 'last line']);
});

test('joins fragments on the same row left to right', () => {
	const lines = linesFromTextItems([
		fragment('10.2026 | Tarrytown Local', 400, 770),
		fragment('[restaurant]', 50, 770),
	]);

	assert.deepEqual(lines, ['[restaurant] 10.2026 | Tarrytown Local']);
});

test('ignores empty and whitespace-only fragments', () => {
	const lines = linesFromTextItems([fragment('', 50, 700), fragment('Rice Pudding | $14', 50, 700), fragment('   ', 50, 600)]);

	assert.deepEqual(lines, ['Rice Pudding | $14']);
});

test('joins a wrapped description into one line', () => {
	const lines = linesFromTextItems([
		describe('La Salumina Salsiccia, 5 Spoke Cheddar, Titusville Eggs, TL', 50, 500),
		describe('Fresh-Milled Buns, with Tallow Fried Potatos', 50, 488),
	]);

	assert.deepEqual(lines, ['La Salumina Salsiccia, 5 Spoke Cheddar, Titusville Eggs, TL Fresh-Milled Buns, with Tallow Fried Potatos']);
});

test('keeps an item and its description apart when the fonts differ, even when close together', () => {
	const lines = linesFromTextItems([fragment('Pumpkin Pie Parfait | $15', 50, 500), describe('Chaseholm Farm Yogurt', 50, 485)]);

	assert.deepEqual(lines, ['Pumpkin Pie Parfait | $15', 'Chaseholm Farm Yogurt']);
});

test('keeps lines apart when there is a gap between them, even in the same font', () => {
	const lines = linesFromTextItems([describe('end of one description', 50, 500), describe('start of the closing note', 50, 440)]);

	assert.deepEqual(lines, ['end of one description', 'start of the closing note']);
});

// The layout that broke the parser: items and a heading stored after the closing
// note in the file, and one description that wraps onto a second line.
test('a menu stored out of order with a wrapped description still parses into the right categories', () => {
	const note = (str, y) => fragment(str, 50, y, { fontName: 'bold' });
	const lines = linesFromTextItems([
		fragment('[restaurant]', 50, 770, { height: 20, fontName: 'title' }),
		fragment('Pumpkin Pie Parfait | $15', 50, 573),
		describe('Chaseholm Farm Yogurt, House Granola', 50, 553),
		fragment('dessert', 50, 300),
		fragment('Rice Pudding | $14', 50, 270),
		describe('Ever Growing Family Farm Akitakomachi', 50, 250),
		note("We're proud to source our ingredients directly from local farms.", 150),
		// Added to the file last, but near the top of the page:
		fragment('10.2026 | Tarrytown Local', 400, 770),
		fragment('breakfast / lunch', 50, 700),
		fragment('The Breakfast Sandwich | $15', 50, 650),
		describe('La Salumina Salsiccia, 5 Spoke Cheddar, TL', 50, 632),
		describe('Fresh-Milled Buns, with Tallow Fried Potatos', 50, 620),
	]);

	const result = parseMenuText(lines.join('\n'));

	assert.equal(result.date, '10.2026');
	assert.equal(result.note, "We're proud to source our ingredients directly from local farms.");
	assert.deepEqual(result.categories, [
		{
			name: 'Breakfast / Lunch',
			items: [
				{
					name: 'The Breakfast Sandwich',
					price: '$15',
					description: 'La Salumina Salsiccia, 5 Spoke Cheddar, TL Fresh-Milled Buns, with Tallow Fried Potatos',
				},
				{ name: 'Pumpkin Pie Parfait', price: '$15', description: 'Chaseholm Farm Yogurt, House Granola' },
			],
		},
		{
			name: 'Dessert',
			items: [{ name: 'Rice Pudding', price: '$14', description: 'Ever Growing Family Farm Akitakomachi' }],
		},
	]);
});
