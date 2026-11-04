import {Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import {grade1SubtractionPairs} from './pair-domain.ts';
import {exactPrimaryWidths, hasPrimaryWidth, matchesMultipleOf10Presence, primaryWidthRows} from './width-domain.ts';

const bounds = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10],
    [Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100],
    [Scope.NumbersSmaller120, 120], [Scope.NumbersSmaller1000, 1000]] as const;
export const placeValueRangeLabels = bounds.map(([label]) => label);
export const placeValueUpperBounds = bounds.map(([, upper]) => upper);
export const placeValueRangeChoices = placeValueRangeLabels.map(label => [label]);
export const maximumAbove = (upper: number): number => createCanonicalNumericRange(upper).maximumAbove;
export const widthRangeDomain = (labels: string[]) => {
    const range = resolveRangeFromLabels(labels);
    return {minimum: Math.max(1, Math.ceil(range.min)), maximum: Math.min(999, Math.floor(range.max)),
        maximumAbove: bounds.some(([, upper]) => range.max === upper) ? maximumAbove(range.max) : -1};
};
export const placeValueRangeContext = [Area.Addition, Area.AdditionPlaceValuePartitioning,
    Area.Subtraction, Area.SubtractionPlaceValuePartitioning, Area.IntegerRegrouping,
    Scope.SingleDigitSmallestOperand, Scope.TwoDigitSmallestOperand, Scope.ThreeDigitSmallestOperand,
    Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand, Scope.ThreeDigitLargestOperand,
    Scope.MultiplesOf10, Scope.MultipleDigitLargestOperand, Scope.MultipleDigitSmallestOperand,
    Scope.NumbersWithZero, Scope.NumbersWithoutZero];
const baseRange = selectExactLabelMap(bounds.map(([label, upper]) => [label, {min: 0, max: upper}] as const));

/** The whole result/minuend dominates every required place count and arithmetic intermediate. */
export function permitsPlaceValueRange(labels: string[], originalZero?: boolean): boolean {
    const range = baseRange(labels);
    if (!range) return false;
    const selected = (label: string) => labels.includes(label);
    const addition = selected(Area.Addition) || selected(Area.AdditionPlaceValuePartitioning);
    const subtraction = selected(Area.Subtraction) || selected(Area.SubtractionPlaceValuePartitioning);
    if (!addition && !subtraction) return true;
    const largest = [Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand, Scope.ThreeDigitLargestOperand];
    const smallest = [Scope.SingleDigitSmallestOperand, Scope.TwoDigitSmallestOperand, Scope.ThreeDigitSmallestOperand];
    const widths = exactPrimaryWidths.filter(width => largest.every((label, index) => !selected(label) || Number(width[0]) === index + 1)
        && smallest.every((label, index) => !selected(label) || Number(width[1]) === index + 1)
        && (!selected(Scope.MultipleDigitLargestOperand) || width[0] !== '1')
        && (!selected(Scope.MultipleDigitSmallestOperand) || width[1] !== '1'));
    const regrouping = selected(Area.IntegerRegrouping);
    const zeroResults = originalZero === undefined ? [false, ...(selected(Scope.NumbersWithZero) ? [true] : [])] : [originalZero];
    const coefficients = selected(Scope.NumbersWithZero) ? [true]
        : selected(Scope.NumbersWithoutZero) ? [false] : [false, true];
    const minimum = 1, maximum = Math.min(999, range.max), floor = maximumAbove(range.max);
    return zeroResults.some(requestedZero => coefficients.some(coefficient => {
        const equality = requestedZero && subtraction && !regrouping;
        if (addition || selected(Area.SubtractionPlaceValuePartitioning) || !selected(Scope.MultiplesOf10)) return widths.some(width => primaryWidthRows({operation: addition ? 'addition' : 'subtraction',
            minimum, maximum, maximumAbove: floor, regrouping,
            zeroResult: equality, coefficientZero: coefficient, multipleOf10Presence: selected(Scope.MultiplesOf10)}, width).length > 0);
        return !regrouping && coefficient === equality
            && grade1SubtractionPairs(minimum, maximum, equality)
                .some(([a, b]) => a > floor && matchesMultipleOf10Presence(a, b, true) && widths.some(width => hasPrimaryWidth(a, b, width)));
    }));
}
export const resolvePlaceValueRange = registerStaticResolver(withLabelChoices(exactResolver((labels: string[]) =>
    permitsPlaceValueRange(labels) ? baseRange(labels) : undefined),
{kind: 'alternatives', alternatives: placeValueRangeChoices, contextLabels: placeValueRangeContext, resolvedContext: true}));
