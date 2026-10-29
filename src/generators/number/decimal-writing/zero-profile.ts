import {Area, Scope} from 'edugraph-ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import type {DecimalWritingProblem} from '../../../types/problems.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const decimalNotationLabels = [Area.DecimalNotation, Area.NumberNameNotation] as const;
export const decimalZeroLabels = [Scope.NumbersWithZero, Scope.NumbersWithoutZero] as const;
export type DecimalZeroProfile = 'legacy' | 'with-zero' | 'without-zero';

/** Unused fractional padding is not an active source numeral coefficient. */
export const decimalWritingHasZero = (data: DecimalWritingProblem): boolean => data.wholePart === 0
    || data.fractionalPart.digits.slice(0, data.fractionalPart.precision === 'tenths' ? 1
        : data.fractionalPart.precision === 'hundredths' ? 2 : 3).includes(0);

/** A new zero request can only use the existing number-name mathematical family. */
export const resolveDecimalNotation = registerStaticResolver(withLabelChoices(exactResolver((labels: string[]) => {
    const notation = decimalNotationLabels.filter(label => labels.includes(label));
    const zero = decimalZeroLabels.filter(label => labels.includes(label));
    if (notation.length > 1 || zero.length > 1 || notation[0] === Area.DecimalNotation && zero.length) return undefined;
    return notation[0] ?? (zero.length ? Area.NumberNameNotation : undefined);
}), {
    kind: 'alternatives', alternatives: decimalNotationLabels.map(label => [label]),
    contextLabels: decimalZeroLabels,
    defaults: decimalZeroLabels.map(label => ({whenAll: [label], labels: [Area.NumberNameNotation]}))
}));

export const resolveDecimalZeroProfile = registerStaticResolver(withLabelChoices(exactResolver(
    (labels: string[]): DecimalZeroProfile | undefined => {
        const notation = decimalNotationLabels.filter(label => labels.includes(label));
        const zero = decimalZeroLabels.filter(label => labels.includes(label));
        if (notation.length > 1 || zero.length > 1) return undefined;
        if (notation[0] === Area.DecimalNotation) return zero.length ? undefined : 'legacy';
        if (zero.length) return zero[0] === Scope.NumbersWithZero ? 'with-zero' : 'without-zero';
        return notation[0] === Area.NumberNameNotation ? undefined : 'legacy';
    }
), {
    kind: 'alternatives', alternatives: [[], ...decimalZeroLabels.map(label => [label])],
    contextLabels: decimalNotationLabels, resolvedContext: true,
    defaults: [{whenAll: [Area.DecimalNotation], labels: []}]
}));
