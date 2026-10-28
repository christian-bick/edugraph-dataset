let seed = 42;
const randomnessGuards: {attempted: boolean}[] = [];

function assertRandomnessAllowed(): void {
    if (!randomnessGuards.length) return;
    for (const guard of randomnessGuards) guard.attempted = true;
    throw new Error('Randomness and random-state mutation are forbidden in this operation.');
}

/** Synchronous pure annotation/configuration checks cannot advance or replace random state. */
export function withoutRandomness<T>(operation: () => T): T {
    const guard = {attempted: false};
    const previousRandom = Math.random;
    randomnessGuards.push(guard);
    Math.random = () => { assertRandomnessAllowed(); throw new Error('Randomness is forbidden.'); };
    try {
        const result = operation();
        if (guard.attempted) throw new Error('The operation attempted to consume or mutate random state.');
        return result;
    } finally {
        Math.random = previousRandom;
        randomnessGuards.pop();
    }
}

// Check if we are in a browser environment with URLSearchParams
if (typeof window !== 'undefined' && window.location) {
    const urlParams = new URLSearchParams(window.location.search);
    const seedParam = urlParams.get('seed');
    if (seedParam) {
        seed = parseInt(seedParam, 10) || 42;
    }
}

export function setSeed(newSeed: number | string) {
    assertRandomnessAllowed();
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
    assertRandomnessAllowed();
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

/** Captures the exact Mulberry32 continuation for a prepared browser configuration. */
export function getRandomState(): number {
    assertRandomnessAllowed();
    return seed >>> 0;
}

export function setRandomState(state: number): void {
    assertRandomnessAllowed();
    if (!Number.isInteger(state) || state < 0 || state > 0xffffffff) {
        throw new Error('Random state must be an unsigned 32-bit integer.');
    }
    seed = state;
}
