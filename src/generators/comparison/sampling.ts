import type {CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';

export interface ComparisonProfile {
    readonly relation: 'less' | 'equal' | 'greater';
    readonly requireNegative: boolean;
    readonly requireZero: boolean;
    readonly range: CanonicalNumericRange;
    /** Local source-domain ceiling; the annotation's inclusive upper bound is unchanged. */
    readonly maximumValue: number;
}

export interface ComparisonIntervals {
    readonly lowMinimum: number;
    readonly lowMaximum: number;
    readonly highMinimum: number;
    readonly highMaximum: number;
}

/**
 * The smaller and larger absolute quantities must witness both canonical descriptors.
 * This is a finite interval calculation, shared by declaration feasibility and sampling.
 */
export function comparisonIntervals(profile: ComparisonProfile): ComparisonIntervals | null {
    const {range, maximumValue, relation, requireZero, requireNegative} = profile;
    if (!['less', 'equal', 'greater'].includes(relation)
        || !Number.isFinite(maximumValue) || maximumValue < 0
        || !Number.isFinite(range.min) || !Number.isFinite(range.max)
        || range.min < 0 || range.min >= range.max
        || !(range.maximumAbove < range.max) || !(range.minimumBelow > range.min)) return null;

    if (requireZero) {
        if (range.min !== 0 || relation === 'equal' && requireNegative) return null;
        if (relation === 'equal') {
            return range.maximumAbove < 0
                ? {lowMinimum: 0, lowMaximum: 0, highMinimum: 0, highMaximum: 0}
                : null;
        }
        const highMinimum = Math.max(1, Math.floor(range.maximumAbove) + 1);
        const highMaximum = Math.floor(Math.min(range.max, maximumValue));
        return highMinimum <= highMaximum
            ? {lowMinimum: 0, lowMaximum: 0, highMinimum, highMaximum}
            : null;
    }

    const minimum = Math.max(1, Math.ceil(range.min));
    const highMaximum = Math.floor(Math.min(range.max, maximumValue));
    const highMinimum = Math.max(minimum, Math.floor(range.maximumAbove) + 1);
    const lowMaximum = Math.min(highMaximum, Math.ceil(range.minimumBelow) - 1);
    if (relation === 'equal') {
        return highMinimum <= lowMaximum
            ? {lowMinimum: highMinimum, lowMaximum, highMinimum, highMaximum: lowMaximum}
            : null;
    }
    // Opposite signs already distinguish the two numbers, even at equal magnitudes.
    const distinctAdjustment = requireNegative ? 0 : 1;
    const feasibleLowMaximum = Math.min(lowMaximum, highMaximum - distinctAdjustment);
    return minimum <= feasibleLowMaximum && highMinimum <= highMaximum
        ? {lowMinimum: minimum, lowMaximum: feasibleLowMaximum, highMinimum, highMaximum}
        : null;
}
