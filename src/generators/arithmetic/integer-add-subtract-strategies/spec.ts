import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const strategyProfiles = [
    [[Area.AdditionMakeTen, Scope.SingleDigitSmallestOperand], 'addition-make-ten'],
    [[Area.AdditionNearDoubles], 'addition-near-doubles'],
    [[Area.AdditionCompensation], 'addition-compensation'],
    [[Area.SubtractionCompensation], 'subtraction-compensation'],
    [[Area.SubtractionMakeTen, Scope.TwoDigitLargestOperand], 'subtraction-make-ten'],
    [[Area.SubtractionThinkAddition, Scope.MultipleDigitLargestOperand], 'subtraction-think-addition']
] as const;

const resolveStrategy = selectExactLabelSetMap(strategyProfiles);

export const spec: GeneratorSpec = {
    generatorId: 'integer-add-subtract-strategies',
    generalLabels: [
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
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
