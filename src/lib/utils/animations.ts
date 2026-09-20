type Preset = { opacity?: number; x?: number; y?: number; scale?: number };

const PRESETS: Record<string, Preset> = {
	"fade-up":    { opacity: 0, y: 30 },
	"fade-up-sm": { opacity: 0, y: 20 },
	"fade-up-lg": { opacity: 0, y: 48 },
	"fade-left":  { opacity: 0, x: -40 },
	"fade-right": { opacity: 0, x: 40 },
	"fade-in":    { opacity: 0 },
};

export const prefersReducedMotion = () =>
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function revealAll() {
	document.querySelectorAll<HTMLElement>("[data-animate]").forEach((el) => {
		el.style.opacity = "1";
		el.style.transform = "none";
	});
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timed out")), ms)),
	]);
}

declare global {
	interface Window {
		__scrollAnimBooted?: boolean;
	}
}

export async function registerScrollAnimations() {
	// Marks that this script actually ran, regardless of what happens next —
	// lets the inline head-script fallback tell "still animating" apart from
	// "this never executed at all" (e.g. blocked entirely by an extension).
	window.__scrollAnimBooted = true;

	if (prefersReducedMotion()) return;

	const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-animate]"));
	if (!elements.length) return;

	try {
		const gsap = (await withTimeout(import("gsap"), 5000)).default;
		const { ScrollTrigger } = await withTimeout(import("gsap/ScrollTrigger"), 5000);
		gsap.registerPlugin(ScrollTrigger);

		runAnimations(gsap, ScrollTrigger, elements);
	} catch (err) {
		console.error("registerScrollAnimations failed, revealing content", err);
		revealAll();
	}
}

function runAnimations(gsap: typeof import("gsap").default, ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger, elements: HTMLElement[]) {
	const scaleKeys = new Set(["scale", "scaleX", "scaleY"]);
	const staggerCounts = new Map<string, number>();

	elements.forEach((el) => {
		const preset = PRESETS[el.dataset.animate ?? ""];
		if (!preset) return;

		const staggerVal = parseFloat(el.dataset.animateStagger ?? "0") || 0;
		let delay = 0;

		if (staggerVal > 0 && el.parentElement) {
			const groupKey = `${el.parentElement.className}::${staggerVal}`;
			const idx = staggerCounts.get(groupKey) ?? 0;
			delay = idx * staggerVal;
			staggerCounts.set(groupKey, idx + 1);
		}

		const st = {
			trigger: el,
			start: "top 90%",
			toggleActions: "play none none none",
		};

		if ("opacity" in preset) {
			gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none", delay, scrollTrigger: st });
		}

		const transformFrom: Record<string, number> = {};
		const transformTo: Record<string, unknown> = { duration: 0.6, ease: "power2.out", delay, scrollTrigger: st };

		for (const [key, val] of Object.entries(preset)) {
			if (key === "opacity") continue;
			transformFrom[key] = val as number;
			transformTo[key] = scaleKeys.has(key) ? 1 : 0;
		}

		if (Object.keys(transformFrom).length > 0) {
			gsap.fromTo(el, transformFrom, transformTo);
		}
	});
}
