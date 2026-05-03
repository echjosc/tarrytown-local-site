// smooth scroll for anchor links
export function initSmoothScroll() {
	const links = document.querySelectorAll("a[href^='#']");

	links.forEach((link) => {
		link.addEventListener("click", (e) => {
			e.preventDefault();
			const target = document.querySelector(link.getAttribute("href")!);
			if (target) {
				target.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		});
	});
}