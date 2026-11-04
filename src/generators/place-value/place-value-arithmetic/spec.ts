import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import {primaryWidthLabels, primaryWidthChoices, primaryWidthFromLabels,
    resolvePrimaryWidth} from './width-profile.ts';
import {resolveResultZero} from './zero-result.ts';
import {coefficientLabels, resolveCoefficientPresence} from './coefficient-profile.ts';
import {placeValueRangeLabels, placeValueRangeChoices, placeValueUpperBounds, resolvePlaceValueRange} from './range-profile.ts';
import {originalOperandFlags, originalOperandLabels, resolveOriginalSingleDigit, resolveOriginalTwoDigit} from './operand-domain.ts';
import {hasNativePairs, operandProfile} from './pair-domain.ts';

const operationLabels = [Area.AdditionPlaceValuePartitioning, Area.SubtractionPlaceValuePartitioning,
    Area.Addition, Area.Subtraction];
const operationValue = selectExactLabelMap([
    [Area.AdditionPlaceValuePartitioning, Area.Addition], [Area.SubtractionPlaceValuePartitioning, Area.Subtraction],
    [Area.Addition, Area.Addition], [Area.Subtraction, Area.Subtraction]
] as const);
const resolveOperation = registerStaticResolver(withLabelChoices(exactResolver((labels: string[]) => {
    const selected = operationLabels.filter(label => labels.includes(label));
    if (selected.length === 1) return operationValue(labels);
    if (selected.length > 1) return undefined;
    // Preserve the legacy partial-request default. A bound operation is never
    // reinterpreted from completed widths; the joint native-domain rule checks it.
    const flags = originalOperandFlags(label => labels.includes(label));
    return flags.requireTwoDigitLargest ? Area.Addition
        : labels.includes(Scope.MultiplesOf10) ? Area.Subtraction : undefined;
}), {kind: 'alternatives', alternatives: operationLabels.map(label => [label]), contextLabels: originalOperandLabels}));

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
            const operations = operationLabels.filter(selected);
            const width = primaryWidthFromLabels(primaryWidthLabels.filter(selected));
            const uppers = placeValueRangeLabels.filter(selected);
            const presence = selected(Scope.NumbersWithZero);
            if (operations.length !== 1 || !width || uppers.length !== 1 || presence === selected(Scope.NumbersWithoutZero)) return false;
            const operation = operations[0] === Area.Addition || operations[0] === Area.AdditionPlaceValuePartitioning
                ? Area.Addition : Area.Subtraction;
            const regrouping = selected(Area.IntegerRegrouping);
            const config: PlaceValueArithmeticGeneratorConfig = {
                operation, requireRegrouping: regrouping,
                ...originalOperandFlags(label => query.exact('target', label)),
                requireMultipleOf10: selected(Scope.MultiplesOf10),
                requireZero: query.exact('target', Scope.NumbersWithZero) && operation === Area.Subtraction && !regrouping,
                largestOperandProfile: width, coefficientPresence: presence,
                range: {min: 0, max: placeValueUpperBounds[placeValueRangeLabels.indexOf(uppers[0]!)]!}
            };
            const domain = operandProfile(config);
            if (!domain) return false;
            if (domain !== 'general' && (operation === Area.Addition ? domain === 'multiples-of-ten'
                : domain !== 'multiples-of-ten' || operations[0] !== Area.Subtraction)) return false;
            return hasNativePairs(config);
        }
    }],
    generalLabels: [Area.PlaceValue, Scope.TwoOperands, Scope.IntegerNumbers,
        Scope.Base10, Scope.NumbersWithoutNegatives]
};

export const PlaceValueArithmeticGeneratorSchema = {
    operation: [operationLabels, resolveOperation, operationLabels.map(label => [label])],
    requireRegrouping: [[Area.IntegerRegrouping], hasLabel(Area.IntegerRegrouping)],
    requireSingleDigitSmallest: [originalOperandLabels, resolveOriginalSingleDigit],
    requireTwoDigitLargest: [originalOperandLabels, resolveOriginalTwoDigit],
    requireMultipleOf10: [[Scope.MultiplesOf10], selectExactLabelSetMap([
        [[], false], [[Scope.MultiplesOf10], true]
    ] as const), [[], [Scope.MultiplesOf10]]],
    requireZero: [[Scope.NumbersWithZero], resolveResultZero],
    // Resolve the range before completing widths in the direct helper path.
    // Planned generation still resolves the authoritative joint assignment.
    range: [placeValueRangeLabels, resolvePlaceValueRange, placeValueRangeChoices],
    largestOperandProfile: [primaryWidthLabels, resolvePrimaryWidth, primaryWidthChoices],
    coefficientPresence: [coefficientLabels, resolveCoefficientPresence, coefficientLabels.map(label => [label])]
} as const;

export type PlaceValueArithmeticGeneratorConfig = ConfigFromSchema<typeof PlaceValueArithmeticGeneratorSchema>;
