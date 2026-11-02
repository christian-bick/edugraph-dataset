import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import {needsPrimaryWidth, permitsPrimaryWidth, primaryWidthContext, primaryWidthLabels,
    resolvePrimaryWidth} from './width-profile.ts';
import {resolveResultZero} from './zero-result.ts';
import {coefficientContext, coefficientLabels, permitsCoefficientProfile,
    resolveCoefficientPresence} from './coefficient-profile.ts';
import {permitsPlaceValueRange, placeValueRangeLabels, placeValueRangeChoices,
    placeValueRangeContext, resolvePlaceValueRange} from './range-profile.ts';

const operationLabels = [Area.AdditionPlaceValuePartitioning, Area.SubtractionPlaceValuePartitioning,
    Area.Addition, Area.Subtraction];
const operationValue = selectExactLabelMap([
    [Area.AdditionPlaceValuePartitioning, Area.Addition],
    [Area.SubtractionPlaceValuePartitioning, Area.Subtraction],
    [Area.Addition, Area.Addition],
    [Area.Subtraction, Area.Subtraction]
] as const);
const resolveOperation = registerStaticResolver(withLabelChoices(exactResolver((labels: string[]) => {
    const selected = operationLabels.filter(label => labels.includes(label));
    if (selected.length !== 1) return undefined;
    const fixedAddition = labels.includes(Scope.SingleDigitSmallestOperand) || labels.includes(Scope.TwoDigitLargestOperand);
    if (fixedAddition && operationValue(labels) !== Area.Addition) return undefined;
    const multiples = labels.includes(Scope.MultiplesOf10) || labels.includes(Scope.TwoDigitSmallestOperand);
    // Without the two-digit addition profile, the whole-tens contract is positive/equal subtraction.
    if (multiples && !labels.includes(Scope.TwoDigitLargestOperand) && selected[0] !== Area.Subtraction) return undefined;
    return operationValue(labels);
}), {kind: 'alternatives', alternatives: operationLabels.map(label => [label]),
    contextLabels: [Scope.MultiplesOf10, Scope.SingleDigitSmallestOperand, Scope.TwoDigitSmallestOperand, Scope.TwoDigitLargestOperand]}));

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec<typeof PlaceValueArithmeticGeneratorSchema> = {
    generatorId: 'place-value-arithmetic',
    compatibility: [generatorLabelRule('place-value-operand-profile', [
        Area.Addition, Area.AdditionPlaceValuePartitioning, Area.Subtraction, Area.SubtractionPlaceValuePartitioning,
        Area.IntegerRegrouping, Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand,
        Scope.MultiplesOf10, Scope.NumbersWithZero, Scope.NumbersWithoutZero
    ], selected => {
        const singleDigit = selected(Scope.SingleDigitSmallestOperand);
        const twoDigit = selected(Scope.TwoDigitLargestOperand);
        const multiples = selected(Scope.MultiplesOf10);
        const regrouping = selected(Area.IntegerRegrouping);
        const addition = selected(Area.Addition) || selected(Area.AdditionPlaceValuePartitioning);
        if (singleDigit && multiples || singleDigit && !twoDigit || twoDigit && !singleDigit && !multiples) return false;
        if (addition) {
            // Two-digit Grade-1 operands expose zero hundreds in every consumer;
            // the result-zero resolver keeps their actual arithmetic positive.
            return !multiples || twoDigit && !regrouping;
        }
        if (twoDigit || singleDigit) return false;
        // The whole-tens profile operates in one unit; its views do not expose
        // the decomposition and partial differences of a partitioning strategy.
        if (multiples && selected(Area.SubtractionPlaceValuePartitioning)) return false;
        return !multiples || !regrouping;
    }), generatorLabelRule('place-value-primary-width', [...primaryWidthLabels, ...primaryWidthContext], selected => {
        const single = selected(Scope.SingleDigitLargestOperand);
        const multiple = selected(Scope.MultipleDigitLargestOperand);
        if (single && multiple) return false;
        if (single || multiple) return permitsPrimaryWidth(selected, single ? 'single' : 'multiple');
        return !needsPrimaryWidth(selected);
    }), {
        id: 'place-value-coefficient-zero',
        dependencies: [
            ...[...coefficientContext, ...coefficientLabels].map(label => ({scope: 'generator' as const, label})),
            {scope: 'target', label: Scope.NumbersWithZero}
        ],
        predicate: labels => permitsCoefficientProfile(label => labels.exact('generator', label),
            labels.exact('target', Scope.NumbersWithZero))
    }, {
        id: 'place-value-canonical-range',
        dependencies: [...[...placeValueRangeLabels, ...placeValueRangeContext].map(label => ({scope: 'generator' as const, label})),
            {scope: 'target', label: Scope.NumbersWithZero}],
        predicate: labels => permitsPlaceValueRange([...placeValueRangeLabels, ...placeValueRangeContext]
            .filter(label => labels.exact('generator', label)), labels.exact('target', Scope.NumbersWithZero))
    }],
    // SPEC-12: neither subtraction nor regrouping alone guarantees this width.
    // Conditional same-value bundles would change direct fallback sampling;
    // keep the existing choices and annotate their resolved conjunction only.
    inferredLabels: [{
        produces: [Scope.MultipleDigitLargestOperand],
        infer: ({operation, requireRegrouping}) => operation === Area.Subtraction && requireRegrouping
            ? [Scope.MultipleDigitLargestOperand]
            : []
    }],
    generalLabels: [
        Area.PlaceValue,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const PlaceValueArithmeticGeneratorSchema = {
    operation: [operationLabels, resolveOperation, operationLabels.map(label => [label])],
    requireRegrouping: [
        [Area.IntegerRegrouping],
        hasLabel(Area.IntegerRegrouping)
    ],
    requireSingleDigitSmallest: [
        [Scope.SingleDigitSmallestOperand],
        hasLabel(Scope.SingleDigitSmallestOperand)
    ],
    requireTwoDigitLargest: [
        [Scope.TwoDigitLargestOperand],
        hasLabel(Scope.TwoDigitLargestOperand)
    ],
    requireMultipleOf10: [
        [Scope.MultiplesOf10, Scope.TwoDigitSmallestOperand],
        selectExactLabelSetMap([
            [[], false],
            [[Scope.MultiplesOf10], true],
            [[Scope.MultiplesOf10, Scope.TwoDigitSmallestOperand], true]
        ] as const),
        [[], [Scope.MultiplesOf10, Scope.TwoDigitSmallestOperand]]
    ],
    requireZero: [
        [Scope.NumbersWithZero],
        resolveResultZero
    ],
    largestOperandProfile: [
        primaryWidthLabels,
        resolvePrimaryWidth,
        [[], ...primaryWidthLabels.map(label => [label])]
    ],
    range: [
        placeValueRangeLabels,
        resolvePlaceValueRange,
        placeValueRangeChoices
    ],
    coefficientPresence: [
        coefficientLabels,
        resolveCoefficientPresence,
        coefficientLabels.map(label => [label])
    ]
} as const;

export type PlaceValueArithmeticGeneratorConfig = ConfigFromSchema<typeof PlaceValueArithmeticGeneratorSchema>;
