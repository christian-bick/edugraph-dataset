import {Area, Scope} from 'edugraph-ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import type {DecimalWritingProblem} from '../../../types/problems.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const decimalNotationLabels = [Area.DecimalNotation, Area.NumberNameNotation] as const;
export const decimalZeroLabels = [Scope.NumbersWithZero, Scope.NumbersWithoutZero] as const;
export type DecimalZeroProfile = 'with-zero' | 'without-zero';

/** Both writing tasks require the whole and fractional quantities. Zero wholes
 * are numerical zero; a zero digit inside a positive fraction is not. */
export const decimalWritingHasZero = (data: DecimalWritingProblem): boolean => data.wholePart === 0;

/** Keep the existing number-name default for a zero request without notation. */
export const resolveDecimalNotation = registerStaticResolver(withLabelChoices(exactResolver((labels: string[]) => {
    const notation = decimalNotationLabels.filter(label => labels.includes(label));
    const zero = decimalZeroLabels.filter(label => labels.includes(label));
    if (notation.length > 1 || zero.length > 1) return undefined;
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
        if (labels.includes(Scope.NumbersSmaller10) && zero.includes(Scope.NumbersWithZero)) return undefined;
        if (zero.length) return zero[0] === Scope.NumbersWithZero ? 'with-zero' : 'without-zero';
        return undefined;
    }
), {
    kind: 'alternatives', alternatives: decimalZeroLabels.map(label => [label]),
    contextLabels: [...decimalNotationLabels, Scope.NumbersSmaller10], resolvedContext: true
}));
