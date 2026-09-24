let seed = 42;

// Check if we are in a browser environment with URLSearchParams
if (typeof window !== 'undefined' && window.location) {
    const urlParams = new URLSearchParams(window.location.search);
    const seedParam = urlParams.get('seed');
    if (seedParam) {
        seed = parseInt(seedParam, 10) || 42;
    }
}

export function setSeed(newSeed: number | string) {
    if (typeof newSeed === 'string') {
        // Simple hash function for string seeds
        let hash = 0;
        for (let i = 0; i < newSeed.length; i++) {
            const char = newSeed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        seed = Math.abs(hash);
    } else {
        seed = newSeed;
    }
}

// Mulberry32 PRNG
export function random(): number {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

/** Captures the exact Mulberry32 continuation for a prepared browser configuration. */
export function getRandomState(): number {
    return seed >>> 0;
}

export function setRandomState(state: number): void {
    if (!Number.isInteger(state) || state < 0 || state > 0xffffffff) {
        throw new Error('Random state must be an unsigned 32-bit integer.');
    }
    seed = state;
}
