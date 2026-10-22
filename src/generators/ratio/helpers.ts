import {GeneratorValidationError} from '../../lib/errors.ts';
import {random} from '../../lib/random.ts';
import type {RatioRational, RatioTableProblem} from '../../types/problems.ts';

export const randomInteger = (min: number, max: number): number =>
    min + Math.floor(random() * (max - min + 1));

export const pick = <T>(values: readonly T[]): T => values[randomInteger(0, values.length - 1)]!;

export function greatestCommonDivisor(first: number, second: number): number {
    let a = first;
    let b = second;
    while (b !== 0) [a, b] = [b, a % b];
    return a;
}

/** Exact nonnegative quantities use a reduced numerator and a strictly positive denominator. */
export function rational(numerator: number, denominator = 1): RatioRational {
    if (!Number.isSafeInteger(numerator) || numerator < 0
        || !Number.isSafeInteger(denominator) || denominator <= 0) {
        throw new RangeError('Ratio quantities require a nonnegative integer numerator and positive integer denominator.');
    }
    const divisor = greatestCommonDivisor(numerator, denominator);
    return {numerator: numerator / divisor, denominator: denominator / divisor};
}

export function validateMagnitudeRange(generatorId: string, range: {min: number; max: number}): number {
    if (typeof range !== 'object' || range === null || range.min !== 0
        || ![20, 100, Number.MAX_SAFE_INTEGER].includes(range.max)) {
        throw new GeneratorValidationError(generatorId, 'Range must start at zero with bound 20, 100, or the unbounded resolver sentinel.');
    }
    // An unspecified upper bound admits a bounded pedagogical draw without inventing a label.
    return range.max === Number.MAX_SAFE_INTEGER ? 99 : range.max - 1;
}

export const ratioQuantities: RatioTableProblem['quantities'][] = [
    [{name: 'red beads', unit: 'beads'}, {name: 'blue beads', unit: 'beads'}],
    [{name: 'apples', unit: 'apples'}, {name: 'oranges', unit: 'oranges'}],
    [{name: 'flour', unit: 'cups'}, {name: 'water', unit: 'cups'}],
    [{name: 'paint', unit: 'liters'}, {name: 'water', unit: 'liters'}]
];

/** Keep graph bounds integral and bounded even when comparison tables use large scales. */
export function ratioTable(
    base: [number, number],
    quantities: RatioTableProblem['quantities'],
    scales: number[]
): RatioTableProblem {
    const largestScale = Math.max(...scales);
    const stepScale = Math.ceil(largestScale / 10);
    const maxScale = Math.ceil(largestScale / stepScale) * stepScale;
    return {
        kind: 'ratio-table',
        quantities,
        base,
        rows: scales.map(scale => ({antecedent: base[0] * scale, consequent: base[1] * scale, scale})),
        coordinateScale: {
            xStep: base[0] * stepScale, yStep: base[1] * stepScale,
            xMax: base[0] * maxScale, yMax: base[1] * maxScale
        }
    };
}
