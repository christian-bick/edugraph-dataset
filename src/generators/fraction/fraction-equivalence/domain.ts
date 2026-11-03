import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {FractionParts} from '../../../types/problems.ts';

export type EquivalentPair = Readonly<{
    firstNumerator: number;
    firstDenominator: FractionParts;
    scaleFactor: 2 | 3 | 4;
}>;
const denominators = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];
const scaleFactors = [2, 3, 4] as const;

/** Original ordered native frames; each had equal probability before range conditioning. */
export const nativeEquivalentPairs: readonly EquivalentPair[] = denominators.flatMap(firstDenominator =>
    scaleFactors.flatMap(scaleFactor => {
        if (!denominators.includes(firstDenominator * scaleFactor as FractionParts)) return [];
        return Array.from({length: firstDenominator - 1}, (_, index) => ({
            firstNumerator: index + 1, firstDenominator, scaleFactor
        }));
    }));

/** The represented whole-part count dominates all numerator, denominator and scale-factor inputs. */
export function equivalentPairs(range: CanonicalNumericRange): readonly EquivalentPair[] {
    if (!range || range.min !== 0 || ![5, 10].includes(range.max))
        throw new GeneratorValidationError('fraction-equivalence', 'Choose a supported canonical part-count range.');
    const canonical = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== canonical.maximumAbove || range.minimumBelow !== canonical.minimumBelow)
        throw new GeneratorValidationError('fraction-equivalence', 'Canonical part-count witnesses must agree with the bounds.');
    return nativeEquivalentPairs.filter(pair => {
        const count = pair.firstDenominator * pair.scaleFactor;
        return count <= range.max && count > range.maximumAbove;
    });
}
