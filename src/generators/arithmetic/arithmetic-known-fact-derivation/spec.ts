import {Area, Scope} from 'edugraph-ts';
import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {
    hasLabel,
    selectExactLabelMap,
    selectExactMatch
} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {knownFactDomain, knownFactStrategy} from './domain.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';

const resolveOperation = selectExactLabelMap([
    [Area.MultiplicationKnownFactDerivation, 'multiplication'],
    [Area.DivisionKnownFactDerivation, 'division']
] as const);

const strategyContext = [Area.MultiplicationKnownFactDerivation, Area.DivisionKnownFactDerivation,
    Area.CommutativeLaw, Area.AssociativeLaw, Area.PlaceValue, Scope.TwoOperands, Scope.ThreeOperands];
const strategyFromLabels = (labels: string[]) => {
    const operation = resolveOperation(labels);
    if (!operation) return undefined;
    const arity = labels.includes(Scope.ThreeOperands) ? 3 : labels.includes(Scope.TwoOperands) ? 2 : undefined;
    return arity ? knownFactStrategy(operation, arity, labels.includes(Area.CommutativeLaw),
        labels.includes(Area.AssociativeLaw), labels.includes(Area.PlaceValue)) : undefined;
};
const rangeProfiles = canonicalRangeProfiles.filter(({range}) => range.max <= 1000 && [0, 5].includes(range.min)
    && range.min < range.max && ['commutative', 'associative', 'inverse-division', 'place-value-scaling'].some(strategy =>
        knownFactDomain(strategy as Parameters<typeof knownFactDomain>[0], range).length > 0));
const rangeChoices = rangeProfiles.map(({labels}) => labels);
const rangeLabels = [...new Set(rangeChoices.flat())];
const permitsRange = (labels: string[], range: Parameters<typeof knownFactDomain>[1]): boolean => {
    // Standalone fallback validation has no strategy provider; resolved draws always do.
    if (!strategyContext.some(label => labels.includes(label))) return true;
    const strategy = strategyFromLabels(labels);
    return strategy !== undefined && knownFactDomain(strategy, range).length > 0;
};
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range && permitsRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability',
    contextLabels: strategyContext, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-known-fact-derivation',
    compatibility: [generatorLabelRule('known-fact-strategy', [
        Area.MultiplicationKnownFactDerivation, Area.DivisionKnownFactDerivation,
        Area.CommutativeLaw, Area.AssociativeLaw, Area.PlaceValue, Scope.TwoOperands, Scope.ThreeOperands
    ], selected => {
        const commutative = selected(Area.CommutativeLaw);
        const associative = selected(Area.AssociativeLaw);
        const scaling = selected(Area.PlaceValue);
        const multiplication = selected(Area.MultiplicationKnownFactDerivation);
        if (Number(commutative) + Number(associative) + Number(scaling) > 1) return false;
        if ((commutative || scaling) && (!multiplication || !selected(Scope.TwoOperands))) return false;
        if (associative && (!multiplication || !selected(Scope.ThreeOperands))) return false;
        return !selected(Scope.ThreeOperands) || associative;
    }), generatorLabelRule('known-fact-canonical-band', [...strategyContext, ...rangeLabels], selected => {
        const labels = [...strategyContext, ...rangeLabels].filter(selected);
        const range = resolveCanonicalRangeFromLabels(labels);
        return range !== undefined && permitsRange(labels, range);
    })],
    generalLabels: [
        Area.Equation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.IntegerNumbers,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const ArithmeticKnownFactDerivationGeneratorSchema = {
    operation: [
        [Area.MultiplicationKnownFactDerivation, Area.DivisionKnownFactDerivation],
        resolveOperation
    ],
    arity: [
        [Scope.TwoOperands, Scope.ThreeOperands],
        selectExactMatch
    ],
    useCommutativeLaw: [
        [Area.CommutativeLaw],
        hasLabel(Area.CommutativeLaw)
    ],
    useAssociativeLaw: [
        [Area.AssociativeLaw],
        hasLabel(Area.AssociativeLaw)
    ],
    usePlaceValueScaling: [
        [
            Area.PlaceValue,
            Scope.MultiplesOf10,
            Scope.SingleDigitSmallestOperand,
            Scope.TwoDigitLargestOperand
        ],
        hasLabel(Area.PlaceValue),
        [
            [Scope.SingleDigitSmallestOperand],
            [Area.PlaceValue, Scope.MultiplesOf10, Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand]
        ]
    ],
    range: [
        rangeLabels,
        resolveRange,
        rangeChoices
    ]
} as const;

export type ArithmeticKnownFactDerivationGeneratorConfig = ConfigFromSchema<
    typeof ArithmeticKnownFactDerivationGeneratorSchema
>;
