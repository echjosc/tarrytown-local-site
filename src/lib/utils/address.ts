export type TownState = {
    town: string | null;
    state: string | null;
};

const US_STATE_ABBREVIATIONS = new Set([
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC'
]);

/*
    @param address - The address to get the town and state from
    @returns An object with the town and state
*/
export function getTownAndStateFromUSAddress(address: string): TownState {
    if (!address) return { town: null, state: null };

    // Drop country if present, can be USA, United States, United States of America, etc.
    let normalized = address.replace(/,?\s*(USA|United States( of America)?)\.?$/i, '').trim();

    // Split on commas
    const parts = normalized.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length < 2) return { town: null, state: null };

    // Last part should contain state + zip
    const lastPart = parts[parts.length - 1];

    // Match "NY 12498" or "New York 12498"
    const tokens = lastPart.split(/\s+/);
    let state: string | null = null;

    // Try abbr first (NY, CA, etc.)
    for (const token of tokens) {
        const upper = token.toUpperCase();
        if (US_STATE_ABBREVIATIONS.has(upper)) {
            state = upper;
            break;
        }
    }

    // Town is usually the part before the lastPart
    const town = parts[parts.length - 2] || null;

    return {
        town: town && town.length > 0 ? town : null,
        state,
    };
}
