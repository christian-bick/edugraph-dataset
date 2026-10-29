import {Scope} from 'edugraph-ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

/** Zero in an exposed coefficient, quotient chunk, or final remainder. */
export const partialQuotientHasZero = (candidate: {
    dividend: number; divisor: number; quotient: number; remainder: number
}): boolean => candidate.remainder === 0
    || [candidate.dividend, candidate.divisor, candidate.quotient].some(value => String(value).includes('0'));

/** The original single-digit-divisor domain already excludes all these zero cases. */
export const resolvePartialQuotientZero = registerStaticResolver(withLabelChoices(exactResolver(
    (labels: string[]): boolean | undefined => {
        const zero = labels.includes(Scope.NumbersWithZero), absence = labels.includes(Scope.NumbersWithoutZero);
        if (zero && absence) return undefined;
        if (zero) return true;
        return absence || labels.includes(Scope.SingleDigitDivisor) ? false : undefined;
    }
), {
    kind: 'alternatives',
    alternatives: [[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]],
    contextLabels: [Scope.SingleDigitDivisor],
    resolvedContext: true,
    defaults: [{whenAll: [Scope.SingleDigitDivisor], labels: [Scope.NumbersWithoutZero]}]
}));
