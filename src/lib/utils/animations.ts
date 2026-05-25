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

export async function registerScrollAnimations() {
	if (prefersReducedMotion()) return;

	const gsap = (await import("gsap")).default;
	const { ScrollTrigger } = await import("gsap/ScrollTrigger");
	gsap.registerPlugin(ScrollTrigger);

	const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-animate]"));
	if (!elements.length) return;

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
