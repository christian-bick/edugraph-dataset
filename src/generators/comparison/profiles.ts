import {Area, Scope} from 'edugraph-ts';
import {canonicalRangeProfiles} from '../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {comparisonIntervals, type ComparisonProfile} from './sampling.ts';

/** Exact two-/three-digit source domains, independently of standard or target identifiers. */
export function comparisonMaximumValue(range: CanonicalNumericRange): number {
    if (range.max === 100 && range.min >= 10) return 99;
    if (range.max === 1000 && range.min >= 100) return 999;
    return range.max;
}

const relations = [
    {labels: [Area.NumericInequality, Scope.Less], relation: 'less'},
    {labels: [Area.NumericEquality, Scope.Equal], relation: 'equal'},
    {labels: [Area.NumericInequality, Scope.Greater], relation: 'greater'}
] as const;

/** Complete pre-generation alternatives, including the previously supported sign/zero contexts. */
export const comparisonProfiles = canonicalRangeProfiles.flatMap(({labels, range}) =>
    relations.flatMap(({labels: relationLabels, relation}) =>
        [false, true].flatMap(requireNegative => [false, true].flatMap(requireZero => {
            const profile: ComparisonProfile = {
                relation, requireNegative, requireZero, range,
                maximumValue: comparisonMaximumValue(range)
            };
            return comparisonIntervals(profile) ? [{
                labels: [
                    ...labels, ...relationLabels,
                    requireNegative ? Scope.NumbersWithNegatives : Scope.NumbersWithoutNegatives,
                    requireZero ? Scope.NumbersWithZero : Scope.NumbersWithoutZero
                ],
                profile
            }] : [];
        })))
);
