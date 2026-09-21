// Shared trigger for anything that shouldn't cost bandwidth/parse time until
// the visitor actually shows intent to use the page (analytics, embeds, etc).
const TRIGGER_EVENTS = ["scroll", "mousemove", "touchstart", "keydown"] as const;

export function deferUntilInteraction(callback: () => void) {
	const trigger = () => {
		TRIGGER_EVENTS.forEach((event) => window.removeEventListener(event, trigger));
		callback();
	};
	TRIGGER_EVENTS.forEach((event) => window.addEventListener(event, trigger, { once: true, passive: true }));
}
