import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {hasLabel, selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {needsPrimaryWidth, permitsPrimaryWidth, primaryWidthContext, primaryWidthLabels,
    resolvePrimaryWidth} from './width-profile.ts';
import {resolveResultZero} from './zero-result.ts';

const resolveOperation = selectExactLabelMap([
    [Area.AdditionPlaceValuePartitioning, Area.Addition],
    [Area.SubtractionPlaceValuePartitioning, Area.Subtraction],
    [Area.Addition, Area.Addition],
    [Area.Subtraction, Area.Subtraction]
] as const);

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
        const zero = selected(Scope.NumbersWithZero);
        const addition = selected(Area.Addition) || selected(Area.AdditionPlaceValuePartitioning);
        if (singleDigit && multiples || singleDigit && !twoDigit || twoDigit && !singleDigit && !multiples) return false;
        if (addition) {
            // Two-digit Grade-1 operands expose zero hundreds in every consumer;
            // the result-zero resolver keeps their actual arithmetic positive.
            const zeroClaim = twoDigit ? zero && !selected(Scope.NumbersWithoutZero) : !zero;
            return zeroClaim && (!multiples || twoDigit && !regrouping);
        }
        if (twoDigit || singleDigit) return false;
        // The whole-tens profile operates in one unit; its views do not expose
        // the decomposition and partial differences of a partitioning strategy.
        if (multiples && selected(Area.SubtractionPlaceValuePartitioning)) return false;
        return multiples ? !regrouping : !zero || !regrouping;
    }), generatorLabelRule('place-value-primary-width', [...primaryWidthLabels, ...primaryWidthContext], selected => {
        const single = selected(Scope.SingleDigitLargestOperand);
        const multiple = selected(Scope.MultipleDigitLargestOperand);
        if (single && multiple) return false;
        if (single || multiple) return permitsPrimaryWidth(selected, single ? 'single' : 'multiple');
        return !needsPrimaryWidth(selected);
    })],
    // SPEC-12: neither subtraction nor regrouping alone guarantees this width.
    // Conditional same-value bundles would change direct fallback sampling;
    // keep the existing choices and annotate their resolved conjunction only.
    inferredLabels: [{
        produces: [Scope.MultipleDigitLargestOperand],
        infer: ({operation, requireRegrouping}) => operation === Area.Subtraction && requireRegrouping
            ? [Scope.MultipleDigitLargestOperand]
            : []
    }, {
        // The positive whole-tens subtraction profile omits empty place counts
        // in every projection. A multiples-wide/default label would overclaim
        // addition and the explicit zero-result profile (SPEC-12).
        produces: [Scope.NumbersWithoutZero],
        infer: ({operation, requireMultipleOf10, requireRegrouping, requireSingleDigitSmallest,
            requireTwoDigitLargest, requireZero}) => operation === Area.Subtraction && requireMultipleOf10
            && !requireRegrouping && !requireSingleDigitSmallest && !requireTwoDigitLargest && !requireZero
            ? [Scope.NumbersWithoutZero]
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
    operation: [[
        Area.AdditionPlaceValuePartitioning,
        Area.SubtractionPlaceValuePartitioning,
        Area.Addition,
        Area.Subtraction
    ], resolveOperation],
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
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        resolveResultZero,
        [[], [Scope.NumbersWithZero]]
    ],
    largestOperandProfile: [
        primaryWidthLabels,
        resolvePrimaryWidth,
        [[], ...primaryWidthLabels.map(label => [label])]
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000]),
        resolveRangeFromLabels
    ]
} as const;

export type PlaceValueArithmeticGeneratorConfig = ConfigFromSchema<typeof PlaceValueArithmeticGeneratorSchema>;
