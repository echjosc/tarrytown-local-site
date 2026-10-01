// Runs before every build. Keeps the /reservations short link in public/_redirects
// in sync with Business Info > Reservation URL in Keystatic.
//
// This script only manages its own marked block at the top of _redirects.
// Everything outside the BEGIN/END markers is hand-written and left untouched.
import { readFile, writeFile } from 'node:fs/promises';
import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../keystatic.config.ts';

const OUTPUT_PATH = new URL('../public/_redirects', import.meta.url);
const TAG = '[sync-reservation-redirect]';
const BEGIN = '# BEGIN sync-reservation-redirect (generated, do not edit inside this block)';
const END = '# END sync-reservation-redirect';

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BLOCK_RE = new RegExp(`${escapeRegExp(BEGIN)}[\\s\\S]*?${escapeRegExp(END)}\\n*`);

async function readExisting() {
	try {
		return (await readFile(OUTPUT_PATH, 'utf8')).replace(/\r\n/g, '\n');
	} catch (err) {
		if (err.code === 'ENOENT') return '';
		throw err;
	}
}

function isValidUrl(value) {
	try {
		const url = new URL(value);
		return url.protocol === 'https:' || url.protocol === 'http:';
	} catch {
		return false;
	}
}

const reader = createReader(process.cwd(), keystaticConfig);
const businessInfo = await reader.singletons.businessInfo.read();
const reservationUrl = businessInfo?.reservationUrl?.trim();

const existing = await readExisting();
// Hand-written rules with any previous generated block stripped out.
const handWritten = existing.replace(BLOCK_RE, '').replace(/^\n+/, '');

let next;
if (!reservationUrl || reservationUrl === '#') {
	console.warn(`${TAG} No Reservation URL set in Business Info, removing generated /reservations redirect.`);
	next = handWritten;
} else if (!isValidUrl(reservationUrl)) {
	console.error(`${TAG} Reservation URL "${reservationUrl}" is not a valid http(s) URL, leaving _redirects unchanged.`);
	process.exit(1);
} else {
	const block = [
		BEGIN,
		'# Source: Business Info > Reservation URL (Keystatic)',
		`/reservations   ${reservationUrl}   302`,
		END,
		'',
	].join('\n');
	// Generated block goes first: the first matching rule wins, so this keeps a
	// catch-all rule further down from swallowing /reservations.
	next = handWritten ? `${block}\n${handWritten}` : block;
}

if (/^\/reservations[\s/]/m.test(handWritten)) {
	console.warn(`${TAG} _redirects also has a hand-written /reservations rule outside the generated block. Remove it to avoid conflicts.`);
}

if (next === existing) {
	console.log(`${TAG} _redirects already up to date.`);
} else {
	await writeFile(OUTPUT_PATH, next);
	console.log(`${TAG} Updated _redirects${reservationUrl && reservationUrl !== '#' ? `: /reservations -> ${reservationUrl}` : ''}`);
}
