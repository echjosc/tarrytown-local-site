/**
 * Utility function to wait for an Astro island to load its content.
 * It observes the specified content element for the presence of an "astro-island" child,
 * and sets a loading state of "data-island-loading" on the content element
 * until the island has loaded its children.
 *
 * @param content - The DOM element containing the Astro island to observe.
 */
export function waitForIsland(content: Element) {
    const island = content.querySelector("astro-island");
    if (!island) return;

    content.setAttribute("data-island-loading", "");
    new MutationObserver((_, obs) => {
        if (island.children.length > 0) {
            content.removeAttribute("data-island-loading");
            obs.disconnect();
        }
    }).observe(island, { childList: true });
}