import {Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const numericProfiles = [
    [[Scope.ProperFractions, Scope.NumbersWithoutZero], 'proper'],
    [[Scope.ImproperFractions, Scope.NumbersWithoutZero], 'improper'],
    [[Scope.NumbersWithoutZero], 'nonzero'],
    [[Scope.NumbersWithZero], 'zero']
] as const;

export type QuotientNumericProfile = typeof numericProfiles[number][1];
export const numericProfileLabels = [...new Set(numericProfiles.flatMap(([labels]) => labels))];
const exactNumericProfile = selectExactLabelSetMap(numericProfiles);

/** The already selected original-operand roles determine which finite profile applies. */
const rolePermits = (labels: readonly string[], profile: QuotientNumericProfile): boolean => {
    if (labels.includes(Scope.FractionNumbers)) return profile === 'proper' || profile === 'improper';
    if (labels.includes(Scope.FractionDividend)) return profile === 'nonzero';
    if (labels.includes(Scope.IntegerDividend)) return profile === 'zero' || profile === 'nonzero';
    // Standalone fallback-contract checks have no owning relation context.
    return true;
};

export const resolveNumericProfile = withLabelChoices(exactResolver((labels: string[]) => {
    const profile = exactNumericProfile(labels);
    return profile && rolePermits(labels, profile) ? profile : undefined;
}), {
    ...exactNumericProfile.labelChoices!,
    relation: 'capability',
    contextLabels: [Scope.FractionNumbers, Scope.FractionDividend, Scope.IntegerDividend,
        Scope.IntegerDivisor, Scope.FractionDivisor],
    resolvedContext: true
});

/** All original fraction-notation draws, partitioned by their displayed quotient. */
export function fractionNotationPairs(magnitude: 'proper' | 'improper'): readonly (readonly [number, number])[] {
    return Array.from({length: 6}, (_, index) => index + 1).flatMap(numerator =>
        Array.from({length: 5}, (_, index) => index + 2)
            .filter(denominator => (numerator < denominator) === (magnitude === 'proper'))
            .map(denominator => [numerator, denominator] as const));
}
