import {Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import {grade1AdditionPairs, grade1SubtractionPairs, operandProfile} from './pair-domain.ts';
import {primaryWidthRows} from './width-domain.ts';
import type {PlaceValueArithmeticGeneratorConfig} from './spec.ts';

const bounds = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10],
    [Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100],
    [Scope.NumbersSmaller120, 120], [Scope.NumbersSmaller1000, 1000]] as const;
export const placeValueRangeLabels = bounds.map(([label]) => label);
export const placeValueRangeChoices = placeValueRangeLabels.map(label => [label]);
export const maximumAbove = (upper: number): number => createCanonicalNumericRange(upper).maximumAbove;
export const widthRangeDomain = (labels: string[]) => {
    const range = resolveRangeFromLabels(labels);
    return {minimum: Math.max(1, Math.ceil(range.min)), maximum: Math.min(999, Math.floor(range.max)),
        maximumAbove: bounds.some(([, upper]) => range.max === upper) ? maximumAbove(range.max) : -1};
};
export const placeValueRangeContext = [Area.Addition, Area.AdditionPlaceValuePartitioning,
    Area.Subtraction, Area.SubtractionPlaceValuePartitioning, Area.IntegerRegrouping,
    Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand, Scope.MultiplesOf10,
    Scope.SingleDigitLargestOperand, Scope.MultipleDigitLargestOperand,
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
    const config: PlaceValueArithmeticGeneratorConfig = {
        operation: addition ? Area.Addition : Area.Subtraction,
        requireRegrouping: selected(Area.IntegerRegrouping),
        requireSingleDigitSmallest: selected(Scope.SingleDigitSmallestOperand),
        requireTwoDigitLargest: selected(Scope.TwoDigitLargestOperand),
        requireMultipleOf10: selected(Scope.MultiplesOf10),
        largestOperandProfile: selected(Scope.SingleDigitLargestOperand) ? 'single'
            : selected(Scope.MultipleDigitLargestOperand) ? 'multiple' : 'legacy',
        requireZero: false, coefficientPresence: false, range
    };
    const profile = operandProfile(config);
    if (!profile || config.largestOperandProfile !== 'legacy' && profile !== 'general') return false;
    const zeroResults = originalZero === undefined ? [false, true] : [originalZero];
    const coefficients = selected(Scope.NumbersWithZero) ? [true]
        : selected(Scope.NumbersWithoutZero) ? [false] : [false, true];
    const minimum = 1, maximum = Math.min(999, range.max), floor = maximumAbove(range.max);
    return zeroResults.some(requestedZero => coefficients.some(coefficient => {
        const equality = requestedZero && subtraction && !config.requireRegrouping;
        if (profile === 'general') return primaryWidthRows({operation: addition ? 'addition' : 'subtraction',
            minimum, maximum, maximumAbove: floor, regrouping: config.requireRegrouping!,
            zeroResult: equality, coefficientZero: coefficient}, config.largestOperandProfile!).length > 0;
        if (addition) return coefficient && profile !== 'multiples-of-ten'
            && grade1AdditionPairs(profile, minimum, maximum, config.requireRegrouping!)
                .some(([a, b]) => a + b > floor);
        return profile === 'multiples-of-ten' && !config.requireRegrouping && coefficient === equality
            && grade1SubtractionPairs(minimum, maximum, equality).some(([a]) => a > floor);
    }));
}
export const resolvePlaceValueRange = registerStaticResolver(withLabelChoices(exactResolver((labels: string[]) =>
    permitsPlaceValueRange(labels) ? baseRange(labels) : undefined),
{kind: 'alternatives', alternatives: placeValueRangeChoices, contextLabels: placeValueRangeContext, resolvedContext: true}));
