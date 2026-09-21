// Iframes with data-src instead of src (e.g. the Google Maps embed) don't load
// until the user actually shows intent to interact with the page. Google's
// Maps embed alone pulls 400+ KiB of its own JS on every page load — deferring
// it keeps that weight off the initial page load entirely for users who never
// scroll or touch the map.
import { deferUntilInteraction } from "./deferUntilInteraction";

export function deferIframeLoad() {
	const iframes = document.querySelectorAll<HTMLIFrameElement>("iframe[data-src]");
	if (!iframes.length) return;

	deferUntilInteraction(() => {
		iframes.forEach((iframe) => {
			const src = iframe.dataset.src;
			if (!src) return;
			iframe.src = src;
			iframe.removeAttribute("data-src");
		});
	});
}
