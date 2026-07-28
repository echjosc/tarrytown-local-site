// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import netlify from '@astrojs/netlify';
import keystatic from '@keystatic/astro';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';

// https://astro.build/config
export default defineConfig({
	output: 'static',
	adapter: netlify(),
	integrations: [react(), markdoc(), keystatic()],
	vite: {
		resolve: {
			alias: {
				'@': new URL('./src', import.meta.url).pathname,
			},
		},
	},

	fonts: [
		{
			// TODO: swap to the client's "TAY Birdie" font once files are provided (see src/styles/global.css --font-primary)
			provider: fontProviders.fontsource(),
			name: 'Libre Franklin',
			cssVariable: '--font-libre-franklin',
			weights: [400, 500, 600, 700, 800],
		},
		{
			provider: fontProviders.fontsource(),
			name: 'Roboto',
			cssVariable: '--font-roboto',
			weights: [400, 500, 600, 700],
		},
	],
});