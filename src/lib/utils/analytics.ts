// gtag.js is 170+ KiB — bigger than the hero image — and was loading
// unconditionally on every page. Deferring it until first interaction keeps
// it off the critical path without losing real pageview data: a session with
// zero scroll/mouse/touch/keyboard activity isn't one worth much insight anyway.
import { deferUntilInteraction } from "./deferUntilInteraction";

declare global {
	interface Window {
		dataLayer?: unknown[];
	}
}

export function loadAnalytics(measurementId: string) {
	deferUntilInteraction(() => {
		window.dataLayer = window.dataLayer || [];
		function gtag(...args: unknown[]) {
			window.dataLayer!.push(args);
		}
		gtag("js", new Date());
		gtag("config", measurementId);

		const script = document.createElement("script");
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
		document.head.appendChild(script);
	});
}
