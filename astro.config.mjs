// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import keystatic from '@keystatic/astro';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';

// https://astro.build/config
export default defineConfig({
	output: 'static',
	integrations: [react(), markdoc(), keystatic()],
	vite: {
		resolve: {
			alias: {
				'@': new URL('./src', import.meta.url).pathname,
			},
		},
	},

	experimental: {
		fonts: [
			{
				provider: fontProviders.fontsource(),
				name: 'Roboto Mono',
				cssVariable: '--font-roboto-mono',
			},
			{
				provider: fontProviders.fontsource(),
				name: 'Homemade Apple',
				cssVariable: '--font-homemade-apple',
			},
			{
				provider: fontProviders.fontsource(),
				name: 'Nunito',
				cssVariable: '--font-nunito',
			},
			{
				provider: fontProviders.local(),
				name: 'Birdie',
				cssVariable: '--font-birdie',
				options: {
					variants: [
						{
							weight: 'normal',
							style: 'normal',
							src: ['./src/assets/fonts/birdie/TAYBirdieRegular.woff2', './src/assets/fonts/birdie/TAYBirdieRegular.woff'],
						}
					]
				}
			}
		]
	}
});