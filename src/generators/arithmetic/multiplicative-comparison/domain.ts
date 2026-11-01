import {createCanonicalNumericRange, hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {MultiplicativeComparisonProblem} from '../../../types/problems.ts';

export type ComparisonOperation = 'multiplication' | 'division-single' | 'division-two';
export interface ComparisonProfile {
    readonly operation: ComparisonOperation;
    readonly range: CanonicalNumericRange;
}

export const comparisonQuantities = (data: MultiplicativeComparisonProblem): number[] =>
    [data.referenceQuantity, data.scaleFactor, data.comparedQuantity];

const originalPairs = Array.from({length: 8}, (_, index) => index + 2).flatMap(scaleFactor =>
    Array.from({length: Math.min(12, Math.floor(100 / scaleFactor)) - 1}, (_, index) => ({
        scaleFactor, referenceQuantity: index + 2, comparedQuantity: scaleFactor * (index + 2)
    })));

/** All original pairs remain; the profile restricts only their existing operation, width and magnitude. */
export function comparisonDomain({operation, range}: ComparisonProfile): MultiplicativeComparisonProblem[] {
    if (!['multiplication', 'division-single', 'division-two'].includes(operation)
        || !range || ![5, 10, 20, 100].includes(range.max)) {
        throw new GeneratorValidationError('multiplicative-comparison', 'Unsupported operation or canonical source band.');
    }
    let expected: CanonicalNumericRange;
    try {
        expected = createCanonicalNumericRange(range.max, range.min);
    } catch {
        throw new GeneratorValidationError('multiplicative-comparison', 'Invalid canonical range.');
    }
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new GeneratorValidationError('multiplicative-comparison', 'Canonical range witnesses are missing or inconsistent.');
    }
    return originalPairs.filter(pair => (operation === 'multiplication'
        || (pair.comparedQuantity < 10) === (operation === 'division-single'))
        && hasCanonicalRangeWitness([pair.referenceQuantity, pair.scaleFactor, pair.comparedQuantity], range))
        .map(pair => ({...pair, operation: operation === 'multiplication' ? 'multiplication' : 'division'}));
}
