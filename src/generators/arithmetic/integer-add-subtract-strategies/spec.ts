import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const strategyProfiles = [
    [[Area.AdditionMakeTen, Scope.SingleDigitSmallestOperand], 'addition-make-ten'],
    [[Area.AdditionNearDoubles], 'addition-near-doubles'],
    [[Area.AdditionCompensation, Scope.SingleDigitLargestOperand], 'addition-compensation-single'],
    [[Area.AdditionCompensation, Scope.MultipleDigitLargestOperand], 'addition-compensation-multiple'],
    [[Area.SubtractionCompensation, Scope.SingleDigitLargestOperand], 'subtraction-compensation-single'],
    [[Area.SubtractionCompensation, Scope.MultipleDigitLargestOperand], 'subtraction-compensation-multiple'],
    [[Area.SubtractionMakeTen, Scope.TwoDigitLargestOperand], 'subtraction-make-ten'],
    [[Area.SubtractionThinkAddition, Scope.MultipleDigitLargestOperand], 'subtraction-think-addition']
] as const;

const resolveStrategy = selectExactLabelSetMap(strategyProfiles);

export const spec: GeneratorSpec<typeof IntegerAddSubtractStrategiesGeneratorSchema> = {
    generatorId: 'integer-add-subtract-strategies',
    generalLabels: [
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ],
    // SPEC-12: width depends on both strategy and range; a strategy-wide bundle would
    // overclaim, while extra schema profiles would alter existing choice/RNG behavior.
    // Here b + (b + 1) < 20 implies b <= 9; the larger operand may still be 10.
    inferredLabels: [{
        produces: [Scope.SingleDigitSmallestOperand],
        infer: ({strategy, range}) => strategy === 'addition-near-doubles' && range && range.max <= 20
            ? [Scope.SingleDigitSmallestOperand]
            : []
    }]
};

export const IntegerAddSubtractStrategiesGeneratorSchema = {
    strategy: [[
        Area.AdditionMakeTen,
        Area.AdditionNearDoubles,
        Area.AdditionCompensation,
        Area.SubtractionCompensation,
        Area.SubtractionMakeTen,
        Area.SubtractionThinkAddition,
        Scope.SingleDigitSmallestOperand,
        Scope.SingleDigitLargestOperand,
        Scope.TwoDigitLargestOperand,
        Scope.MultipleDigitLargestOperand
    ], resolveStrategy, strategyProfiles.map(([labels]) => labels)],
    range: [
        deductCompatible([Scope.NumbersSmaller1000]),
        resolveRangeFromLabels
    ]
} as const;

export type IntegerAddSubtractStrategiesGeneratorConfig = ConfigFromSchema<
    typeof IntegerAddSubtractStrategiesGeneratorSchema
>;
