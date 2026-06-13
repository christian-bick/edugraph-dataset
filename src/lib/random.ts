let seed = 42;

// Check if we are in a browser environment with URLSearchParams
if (typeof window !== 'undefined' && window.location) {
    const urlParams = new URLSearchParams(window.location.search);
    const seedParam = urlParams.get('seed');
    if (seedParam) {
        seed = parseInt(seedParam, 10) || 42;
    }
}

export function setSeed(newSeed: number) {
    seed = newSeed;
}

// Mulberry32 PRNG
export function random(): number {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
