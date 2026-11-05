import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {FractionParts} from '../../../types/problems.ts';

const denominators = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];

/** Validate the complete preselected canonical contract before consuming entropy. */
export function comparisonPartCountUpper(range: CanonicalNumericRange): 5 | 10 {
    if (!range || Object.is(range.min, -0) || range.min !== 0 || ![5, 10].includes(range.max))
        throw new GeneratorValidationError('fraction-comparison', 'Choose a supported canonical part-count range.');
    const canonical = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== canonical.maximumAbove || range.minimumBelow !== canonical.minimumBelow)
        throw new GeneratorValidationError('fraction-comparison', 'Canonical part-count witnesses must agree with the bounds.');
    return range.max as 5 | 10;
}

/** Positive proper-fraction denominators dominate both assessed part counts. */
export const hasComparisonPartCountUpper = (first: number, second: number, upper: 5 | 10): boolean => {
    const largest = Math.max(first, second);
    return largest <= upper && largest > (upper === 5 ? -1 : 5);
};

/** Condition the old uniform ordered-denominator-pair law, retaining its two draws. */
export function sampleComparisonDenominators(upper: 5 | 10, draw: () => number): [FractionParts, FractionParts] {
    const pairs = denominators.flatMap(first => denominators
        .filter(second => first !== second && hasComparisonPartCountUpper(first, second, upper))
        .map(second => ({first, second})));
    const index = (length: number) => {
        const value = draw();
        if (!Number.isFinite(value) || value < 0 || value >= 1)
            throw new GeneratorValidationError('fraction-comparison', 'A comparison draw must lie in the half-open unit interval.');
        return Math.floor(value * length);
    };
    const first = pairs[index(pairs.length)]!.first;
    const seconds = pairs.filter(pair => pair.first === first).map(pair => pair.second);
    return [first, seconds[index(seconds.length)]!];
}
