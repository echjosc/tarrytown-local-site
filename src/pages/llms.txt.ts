import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';

// Follows the llms.txt convention (https://llmstxt.org/): an H1 title, a
// blockquote summary, then H2 sections of markdown links. Regenerated at
// build time from the same CMS content the rest of the site reads, so it
// stays current — new pages/posts just need adding to the lists below.

const PAGES: { title: string; path: string; description: string }[] = [
	{ title: 'Menu', path: '/menu', description: "Today's restaurant and bakery menu, with prices." },
	{ title: 'Restaurant', path: '/restaurant', description: 'Dining room hours, reservations, and sample menu.' },
	{ title: 'Bakery', path: '/bakery', description: 'Bakery offerings and hours.' },
	{ title: 'Grocery', path: '/grocery', description: 'Small grocery store — what we carry and how we source it.' },
	{ title: 'Events & Catering', path: '/events', description: 'Onsite private events and offsite catering.' },
	{ title: 'Our Story', path: '/our-story', description: 'Our commitments, sourcing standards, and FAQ.' },
	{ title: 'Our Team', path: '/our-team', description: 'Who we are.' },
	{ title: 'Where We Get Our Food', path: '/farmers', description: 'The farms and producers we source from.' },
	{ title: 'Contact', path: '/contact', description: 'Address, hours, and how to reach us.' },
];

export const GET: APIRoute = async ({ site }) => {
	const siteUrl = site ?? new URL('https://tarrytownlocal.com');
	const reader = createReader(process.cwd(), keystaticConfig);
	const businessInfo = await reader.singletons.businessInfo.read();

	const address = businessInfo?.addressLines?.join(', ') || '57 N Broadway, Tarrytown, NY 10591';
	const email = businessInfo?.email || 'info@tarrytownlocal.com';
	const phone = businessInfo?.phone;
	const hours = businessInfo?.hours?.length
		? businessInfo.hours.map((h) => `${h.days}: ${h.hours}`).join('; ')
		: undefined;

	const posts = (await getCollection('posts'))
		.filter((post) => !post.data.draft)
		.sort((a, b) => {
			const dateA = a.data.date ? new Date(a.data.date).getTime() : 0;
			const dateB = b.data.date ? new Date(b.data.date).getTime() : 0;
			return dateB - dateA;
		});

	const lines: string[] = [];

	lines.push(`# ${businessInfo?.name || 'Tarrytown Local'}`);
	lines.push('');
	lines.push(
		'> Neighborhood restaurant, bakery, and small grocery store in Tarrytown, NY, focused on local, healthful food.'
	);
	lines.push('');
	lines.push(`Address: ${address}`);
	lines.push(`Email: ${email}`);
	if (phone) lines.push(`Phone: ${phone}`);
	if (hours) lines.push(`Hours: ${hours}`);
	lines.push('');

	lines.push('## Pages');
	for (const page of PAGES) {
		lines.push(`- [${page.title}](${new URL(page.path, siteUrl).href}): ${page.description}`);
	}
	lines.push('');

	if (posts.length > 0) {
		lines.push('## Blog — The Good Dirt');
		for (const post of posts) {
			const description = post.data.excerpt || post.data.title;
			lines.push(`- [${post.data.title}](${new URL(`/blog/${post.id}`, siteUrl).href}): ${description}`);
		}
		lines.push('');
	}

	lines.push('## Optional');
	lines.push(`- [Sitemap](${new URL('/sitemap-index.xml', siteUrl).href})`);
	lines.push(`- [Privacy Policy](${new URL('/privacy', siteUrl).href})`);
	lines.push(`- [Terms](${new URL('/terms', siteUrl).href})`);

	return new Response(lines.join('\n') + '\n', {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
};
