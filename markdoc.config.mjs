import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
	tags: {
		'footnote-ref': {
			render: component('./src/components/markdoc/FootnoteRef.astro'),
			selfClosing: true,
			attributes: {
				id: { type: String, required: true },
			},
		},
		footnotes: {
			render: component('./src/components/markdoc/Footnotes.astro'),
		},
		footnote: {
			render: component('./src/components/markdoc/Footnote.astro'),
			attributes: {
				id: { type: String, required: true },
			},
		},
	},
});
