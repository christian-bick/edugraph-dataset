import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import {primaryWidthLabels, primaryWidthChoices, primaryWidthFromLabels,
    resolvePrimaryWidth} from './width-profile.ts';
import {resolveResultZero} from './zero-result.ts';
import {coefficientLabels, resolveCoefficientPresence} from './coefficient-profile.ts';
import {placeValueRangeLabels, placeValueRangeChoices, placeValueUpperBounds, resolvePlaceValueRange} from './range-profile.ts';
import {originalOperandFlags, originalOperandLabels, resolveOriginalSingleDigit,
    resolveOriginalTwoDigit, resolveOriginalMultipleOf10} from './operand-domain.ts';
import {hasNativePairs, operandProfile} from './pair-domain.ts';

const operationLabels = [Area.AdditionPlaceValuePartitioning, Area.SubtractionPlaceValuePartitioning,
    Area.Addition, Area.Subtraction];
const fullAddition = [Area.Addition, Area.AdditionPlaceValuePartitioning];
const fullSubtraction = [Area.Subtraction, Area.SubtractionPlaceValuePartitioning];
const operationChoices = [fullAddition, [Area.Subtraction], fullSubtraction];

/** Full partial-equation mathematics versus positive whole-tens subtraction. */
export function placeValueOperation(selected: (label: string) => boolean) {
    const addition = selected(Area.Addition) || selected(Area.AdditionPlaceValuePartitioning);
    const subtraction = selected(Area.Subtraction) || selected(Area.SubtractionPlaceValuePartitioning);
    if (addition && subtraction) return undefined;
    if (addition) return Area.Addition;
    if (selected(Area.SubtractionPlaceValuePartitioning)) {
        return selected(Scope.MultiplesOf10) && !selected(Scope.NumbersWithZero) ? undefined : Area.Subtraction;
    }
    return subtraction && !selected(Scope.NumbersWithZero) ? Area.Subtraction : undefined;
}
const resolveOperation = registerStaticResolver(withLabelChoices(exactResolver((labels: string[]) => {
    const selected = (label: string) => labels.includes(label);
    const operation = placeValueOperation(selected);
    if (operation || operationLabels.some(selected)) return operation;
    const flags = originalOperandFlags(selected);
    return flags.requireTwoDigitLargest ? Area.Addition : selected(Scope.MultiplesOf10) ? Area.Subtraction : undefined;
}), {kind: 'alternatives', alternatives: operationChoices, relation: 'capability',
    contextLabels: [...originalOperandLabels, Scope.NumbersWithZero],
    defaults: [
        {whenAll: [Scope.MultiplesOf10, Scope.TwoDigitLargestOperand], labels: fullAddition},
        {whenAll: [Scope.MultiplesOf10, Scope.NumbersWithZero], labels: fullSubtraction},
        {whenAll: [Scope.MultiplesOf10], whenNone: [Scope.NumbersWithZero], labels: [Area.Subtraction]}
    ]}));

// No unconditional absent default: a broad request retains both truthful native subsets.
const resolveMultipleOf10Presence = registerStaticResolver(withLabelChoices(exactResolver(
    (labels: string[]) => labels.includes(Scope.MultiplesOf10)
), {kind: 'alternatives', alternatives: [[], [Scope.MultiplesOf10]]}));

const nativeLabels = [...operationLabels, Area.IntegerRegrouping, Scope.MultiplesOf10,
    ...primaryWidthLabels, ...coefficientLabels, ...placeValueRangeLabels];
export const spec: GeneratorSpec<typeof PlaceValueArithmeticGeneratorSchema> = {
    generatorId: 'place-value-arithmetic',
    compatibility: [{
        id: 'place-value-native-width-profile',
        dependencies: [
            ...nativeLabels.map(label => ({scope: 'generator' as const, label})),
            ...[...originalOperandLabels, Scope.NumbersWithZero].map(label => ({scope: 'target' as const, label}))
        ],
        predicate: query => {
            const selected = (label: string) => query.exact('generator', label);
            const operation = placeValueOperation(selected);
            const width = primaryWidthFromLabels(primaryWidthLabels.filter(selected));
            const uppers = placeValueRangeLabels.filter(selected);
            const presence = selected(Scope.NumbersWithZero);
            if (!operation || !width || uppers.length !== 1 || presence === selected(Scope.NumbersWithoutZero)) return false;
            // Every full family carries its complete, non-specializing Area bundle.
            if (operation === Area.Addition && !fullAddition.every(selected)) return false;
            const regrouping = selected(Area.IntegerRegrouping);
            const config: PlaceValueArithmeticGeneratorConfig = {
                operation, requireRegrouping: regrouping,
                ...originalOperandFlags(label => query.exact('target', label)),
                requireMultipleOf10: query.exact('target', Scope.MultiplesOf10),
                multipleOf10Presence: selected(Scope.MultiplesOf10),
                requireZero: query.exact('target', Scope.NumbersWithZero) && operation !== Area.Addition && !regrouping,
                largestOperandProfile: width, coefficientPresence: presence,
                range: {min: 0, max: placeValueUpperBounds[placeValueRangeLabels.indexOf(uppers[0]!)]!}
            };
            const domain = operandProfile(config);
            if (!domain) return false;
            if (operation === Area.Addition && domain === 'multiples-of-ten') return false;
            if (operation !== Area.Addition && domain !== 'general' && domain !== 'multiples-of-ten') return false;
            if (operation === Area.Subtraction) {
                const full = domain === 'general' || config.requireZero;
                if (full ? !fullSubtraction.every(selected) : selected(Area.SubtractionPlaceValuePartitioning)) return false;
            }
            return hasNativePairs(config);
        }
    }],
    generalLabels: [Area.PlaceValue, Scope.TwoOperands, Scope.IntegerNumbers,
        Scope.Base10, Scope.NumbersWithoutNegatives]
};

export const PlaceValueArithmeticGeneratorSchema = {
    operation: [operationLabels, resolveOperation, operationChoices],
    requireRegrouping: [[Area.IntegerRegrouping], hasLabel(Area.IntegerRegrouping)],
    requireSingleDigitSmallest: [originalOperandLabels, resolveOriginalSingleDigit],
    requireTwoDigitLargest: [originalOperandLabels, resolveOriginalTwoDigit],
    requireMultipleOf10: [[Scope.MultiplesOf10], resolveOriginalMultipleOf10],
    multipleOf10Presence: [[Scope.MultiplesOf10], resolveMultipleOf10Presence, [[], [Scope.MultiplesOf10]]],
    requireZero: [[Scope.NumbersWithZero], resolveResultZero],
    range: [placeValueRangeLabels, resolvePlaceValueRange, placeValueRangeChoices],
    largestOperandProfile: [primaryWidthLabels, resolvePrimaryWidth, primaryWidthChoices],
    coefficientPresence: [coefficientLabels, resolveCoefficientPresence, coefficientLabels.map(label => [label])]
} as const;

export type PlaceValueArithmeticGeneratorConfig = ConfigFromSchema<typeof PlaceValueArithmeticGeneratorSchema>;
