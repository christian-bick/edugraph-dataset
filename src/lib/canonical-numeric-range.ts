/** The pinned ontology's positive absolute-magnitude thresholds. */
export const CANONICAL_RANGE_THRESHOLDS = [5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000] as const;

export type CanonicalRangeBound = typeof CANONICAL_RANGE_THRESHOLDS[number];

/** Inclusive bounds plus the witnesses that make both descriptors tightest. */
export interface CanonicalNumericRange {
    readonly min: number;
    readonly max: number;
    readonly maximumAbove: number;
    readonly minimumBelow: number;
}

/** Zero denotes no positive lower descriptor, not a numerical-zero claim. */
export function createCanonicalNumericRange(upper: number, lower = 0): CanonicalNumericRange {
    const upperIndex = CANONICAL_RANGE_THRESHOLDS.findIndex(value => value === upper);
    const lowerIndex = CANONICAL_RANGE_THRESHOLDS.findIndex(value => value === lower);
    if (upperIndex < 0 || lower !== 0 && lowerIndex < 0 || lower >= upper) {
        throw new Error(`Invalid canonical numeric bounds: ${lower}..${upper}.`);
    }
    return {
        min: lower,
        max: upper,
        maximumAbove: upperIndex === 0 ? -1 : CANONICAL_RANGE_THRESHOLDS[upperIndex - 1]!,
        minimumBelow: lower === 0 ? CANONICAL_RANGE_THRESHOLDS[0] : CANONICAL_RANGE_THRESHOLDS[lowerIndex + 1]!
    };
}

/** Tests the declared mathematical quantities; it never selects or returns labels. */
export function hasCanonicalRangeWitness(values: readonly number[], range: CanonicalNumericRange): boolean {
    if (values.length === 0 || values.some(value => !Number.isFinite(value))) return false;
    let min = Infinity;
    let max = -Infinity;
    for (const value of values) {
        const magnitude = Math.abs(value);
        min = Math.min(min, magnitude);
        max = Math.max(max, magnitude);
    }
    return min >= range.min && max <= range.max
        && max > range.maximumAbove && min < range.minimumBelow;
}
