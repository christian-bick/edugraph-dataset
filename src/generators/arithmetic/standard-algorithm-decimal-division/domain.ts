import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';

export const STANDARD_DECIMAL_DIVISION_UPPERS = [10, 20, 100, 120, 1000, 10000, 100000, 1000000] as const;
export const STANDARD_DECIMAL_DIVISORS = [2, 3, 4, 5, 8, 12, 15, 16, 25, 40, 125, 250, 1005] as const;
export interface DecimalDivisionSourceProfile {
    readonly divisorScale: number;
    readonly quotientScale: number;
    readonly divisorCoefficient: number;
    readonly minimum: number;
    readonly maximum: number;
}
export interface DecimalDivisionCase extends DecimalDivisionSourceProfile {
    readonly first: number;
    readonly last: number;
    readonly step: number;
    readonly weight: number;
}

/** The largest previously declared corpus contains every old explicit/default
 * source path. Conditioning this one law changes their former cap mixture. */
export const decimalDivisionSourceProfiles = (cap = 1000000): readonly DecimalDivisionSourceProfile[] =>
    [0, 1, 2, 3].flatMap(divisorScale => [0, 1, 2].flatMap(quotientScale =>
        STANDARD_DECIMAL_DIVISORS.map(divisorCoefficient => ({divisorScale, quotientScale, divisorCoefficient,
            minimum: divisorCoefficient >= 10 * 10 ** divisorScale ? 0
                : Math.ceil(10 * 10 ** (divisorScale + quotientScale) / divisorCoefficient),
            maximum: Math.floor(cap / divisorCoefficient)
        })).filter(p => divisorScale + quotientScale > 0 && p.minimum <= p.maximum)));

/** A short integer trace classifies the finite prefix. Supplied trailing-zero
 * trims only remove/add zero work after exact completion, so its max is stable. */
export function decimalDivisionMaximum(profile: DecimalDivisionSourceProfile, coefficient: number): number {
    const D = profile.divisorCoefficient, q = profile.quotientScale;
    const normalized = D * coefficient / 10 ** q;
    let maximum = Math.max(normalized, D, 10 ** profile.divisorScale);
    const digits = String(D * coefficient).padStart(q + 1, '0').split('').map(Number);
    const decimalIndex = digits.length - q;
    let first = 0, partial = digits[0]!;
    while (partial < D && first < decimalIndex - 1) partial = 10 * partial + digits[++first]!;
    maximum = Math.max(maximum, partial);
    let remainder = partial % D;
    for (let i = first + 1; i < digits.length; i++) {
        partial = 10 * remainder + digits[i]!;
        maximum = Math.max(maximum, partial);
        remainder = partial % D;
    }
    return maximum;
}

/** Number of old raw draws mapped onto C by the round-down-to-five scenario. */
export function roundedDivisionPreimages(coefficient: number, minimum: number, maximum: number): number {
    if (coefficient < minimum || coefficient > maximum) return 0;
    if (coefficient % 5 === 0) return Math.min(5, maximum - coefficient + 1);
    return Math.floor(coefficient / 5) * 5 < minimum ? 1 : 0;
}

const source = decimalDivisionSourceProfiles();
const cache = new Map<number, readonly DecimalDivisionCase[]>();

export function standardDecimalDivisionCases(range: CanonicalNumericRange): readonly DecimalDivisionCase[] {
    if (!range || range.min !== 0 || !STANDARD_DECIMAL_DIVISION_UPPERS.includes(range.max as never))
        throw new GeneratorValidationError('standard-algorithm-decimal-division', 'Select a supported canonical division range.');
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new GeneratorValidationError('standard-algorithm-decimal-division', 'Canonical range witnesses must agree with the selected bounds.');
    const previous = cache.get(range.max);
    if (previous) return previous;
    const cases: DecimalDivisionCase[] = [];
    const add = (p: DecimalDivisionSourceProfile, first: number, last: number, step: number, perCoefficient: number) => {
        if (first <= last) cases.push({...p, first, last, step,
            weight: (Math.floor((last - first) / step) + 1) * perCoefficient / source.length});
    };
    for (const p of source) {
        const {minimum: L, maximum: R, divisorCoefficient: D, quotientScale: q} = p;
        const N = R - L + 1, threshold = 10 ** (q + 1);
        const uniform = (L === 0 ? 2 : 3) / (4 * N);
        for (let C = L; C <= Math.min(R, threshold - 1); C++) {
            const maximum = decimalDivisionMaximum(p, C);
            if (maximum <= range.maximumAbove || maximum > range.max) continue;
            const atom = uniform + roundedDivisionPreimages(C, L, R) / (4 * N)
                + (L === 0 && C === 0 ? 1 / 4 : 0);
            add(p, C, C, 1, atom);
        }
        // In this tail N=D*C/10^q >=10D: the first partial is <=N and
        // every later partial is <10D. Source minima also prove 10^d<=N.
        const first = Math.max(L, threshold, Math.floor(range.maximumAbove * 10 ** q / D) + 1);
        const last = Math.min(R, Math.floor(range.max * 10 ** q / D));
        add(p, first, last, 1, uniform);
        const roundedFirst = Math.ceil(L / 5) * 5;
        add(p, first, Math.min(last, roundedFirst - 1), 1, 1 / (4 * N));
        const multipleFirst = Math.ceil(Math.max(first, roundedFirst) / 5) * 5;
        const multipleLast = Math.floor(Math.min(last, R - 4) / 5) * 5;
        add(p, multipleFirst, multipleLast, 5, 5 / (4 * N));
        const finalMultiple = Math.floor(R / 5) * 5;
        if (finalMultiple >= roundedFirst && finalMultiple >= first && finalMultiple <= last
            && finalMultiple > multipleLast)
            add(p, finalMultiple, finalMultiple, 1, (R - finalMultiple + 1) / (4 * N));
    }
    cache.set(range.max, cases);
    return cases;
}
